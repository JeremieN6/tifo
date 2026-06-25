import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import OpenAI from 'openai';
import pool from './db';

const WEEKLY_IDEA_INTERVAL_DAYS = 7;

export type BlogQueueItem = {
  id: number;
  prompt: string;
  topic: string;
  source: 'seed' | 'auto_weekly';
  attempts: number;
};

export type GeneratedBlogArticle = {
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  contentMarkdown: string;
  targetKeywords: string[];
};

type SeedRow = {
  prompt: string;
  topic: string;
};

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.NANO_USER_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquante');
  }

  return new OpenAI({ apiKey });
}

function getSeedFilePath(): string {
  const envPath = process.env.BLOG_ARTICLE_SEED_FILE;
  if (envPath && envPath.trim().length > 0) {
    return envPath.trim();
  }

  return join(process.cwd(), 'tmp', 'todo', 'auto-blog-article.md');
}

function parseSeedRows(raw: string): SeedRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: SeedRow[] = [];
  let promptParts: string[] = [];
  let waitingTopic = false;

  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (normalized === 'prompt' || normalized === 'topic' || normalized === 'prompt\ttopic') {
      continue;
    }

    if (!waitingTopic) {
      promptParts.push(line);
      if (line.endsWith('?')) {
        waitingTopic = true;
      }
      continue;
    }

    const prompt = promptParts.join(' ').replace(/\s+/g, ' ').trim();
    const topic = line.replace(/\s+/g, ' ').trim();

    if (prompt && topic) {
      rows.push({ prompt, topic });
    }

    promptParts = [];
    waitingTopic = false;
  }

  return rows;
}

function cleanJsonPayload(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function toSlug(value: string): string {
  const base = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return base.slice(0, 200) || `article-${Date.now()}`;
}

function normalizeGeneratedArticle(data: unknown): GeneratedBlogArticle {
  const payload = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

  const title = String(payload.title ?? '').trim();
  const excerpt = String(payload.excerpt ?? '').trim();
  const metaDescription = String(payload.metaDescription ?? '').trim();
  const contentMarkdown = String(payload.contentMarkdown ?? '').trim();

  const rawKeywords = Array.isArray(payload.targetKeywords) ? payload.targetKeywords : [];
  const targetKeywords = rawKeywords
    .map((keyword: unknown) => String(keyword).trim())
    .filter(Boolean)
    .slice(0, 12);

  if (!title || !excerpt || !metaDescription || !contentMarkdown) {
    throw new Error('Le JSON article est incomplet');
  }

  const slug = toSlug(String(payload.slug ?? title));

  return {
    title,
    slug,
    excerpt,
    metaDescription,
    contentMarkdown,
    targetKeywords,
  };
}

export async function syncBlogQueueFromSeedFile(): Promise<{ inserted: number; parsed: number; filePath: string }> {
  const filePath = getSeedFilePath();
  const content = await readFile(filePath, 'utf8');
  const rows = parseSeedRows(content);

  let inserted = 0;

  for (const row of rows) {
    const result = await pool.query(
      `INSERT INTO blog_article_queue (prompt, topic, source, status, updated_at)
       VALUES ($1, $2, 'seed', 'pending', NOW())
       ON CONFLICT (prompt) DO NOTHING`,
      [row.prompt, row.topic]
    );

    inserted += result.rowCount ?? 0;
  }

  return {
    inserted,
    parsed: rows.length,
    filePath,
  };
}

export async function claimNextPendingBlogQueueItem(): Promise<BlogQueueItem | null> {
  const result = await pool.query(
    `WITH next_item AS (
      SELECT id
      FROM blog_article_queue
      WHERE status = 'pending'
      ORDER BY id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE blog_article_queue q
    SET
      status = 'processing',
      attempts = q.attempts + 1,
      picked_at = NOW(),
      updated_at = NOW()
    FROM next_item
    WHERE q.id = next_item.id
    RETURNING q.id, q.prompt, q.topic, q.source, q.attempts`
  );

  return result.rows[0] ?? null;
}

export async function markBlogQueueItemDone(queueId: number): Promise<void> {
  await pool.query(
    `UPDATE blog_article_queue
     SET status = 'done', processed_at = NOW(), last_error = NULL, updated_at = NOW()
     WHERE id = $1`,
    [queueId]
  );
}

export async function markBlogQueueItemError(queueId: number, errorMessage: string): Promise<void> {
  await pool.query(
    `UPDATE blog_article_queue
     SET status = 'error', last_error = $2, updated_at = NOW()
     WHERE id = $1`,
    [queueId, errorMessage.slice(0, 4000)]
  );
}

export async function createWeeklyPromptIfDue(): Promise<SeedRow | null> {
  const dueResult = await pool.query(
    `SELECT MAX(created_at) AS last_created_at
     FROM blog_article_queue
     WHERE source = 'auto_weekly'`
  );

  const lastCreatedAt = dueResult.rows[0]?.last_created_at as string | null | undefined;
  if (lastCreatedAt) {
    const elapsedMs = Date.now() - new Date(lastCreatedAt).getTime();
    const minIntervalMs = WEEKLY_IDEA_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    if (elapsedMs < minIntervalMs) {
      return null;
    }
  }

  const openai = getOpenAIClient();
  const model = process.env.BLOG_ARTICLE_MODEL ?? 'gpt-4.1-mini';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Generate one SEO blog prompt idea per week for an AI tool called Tifo. Focus on football clubs, sports social media, and adjacent growth topics. Return JSON only: {"prompt":"... ?", "topic":"..."}.',
      },
      {
        role: 'user',
        content:
          'Provide one fresh long-tail prompt question and one concise topic label. The prompt must end with a question mark and be commercially relevant for amateur football clubs.',
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Réponse vide lors de la génération du prompt hebdomadaire');
  }

  const parsed = JSON.parse(cleanJsonPayload(raw));
  const prompt = String(parsed?.prompt ?? '').replace(/\s+/g, ' ').trim();
  const topic = String(parsed?.topic ?? '').replace(/\s+/g, ' ').trim();

  if (!prompt || !topic || !prompt.endsWith('?')) {
    throw new Error('Prompt hebdomadaire invalide');
  }

  const insertResult = await pool.query(
    `INSERT INTO blog_article_queue (prompt, topic, source, status, updated_at)
     VALUES ($1, $2, 'auto_weekly', 'pending', NOW())
     ON CONFLICT (prompt) DO NOTHING
     RETURNING id`,
    [prompt, topic]
  );

  if (insertResult.rowCount === 0) {
    return null;
  }

  return { prompt, topic };
}

export async function generateBlogArticle(prompt: string, topic: string): Promise<GeneratedBlogArticle> {
  const openai = getOpenAIClient();
  const model = process.env.BLOG_ARTICLE_MODEL ?? 'gpt-4.1-mini';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an expert SEO sports writer. Return JSON only with keys: title, slug, excerpt, metaDescription, contentMarkdown, targetKeywords. Write a comprehensive, practical article with clear sections, examples, and a CTA that naturally mentions Tifo. No HTML, markdown only.',
      },
      {
        role: 'user',
        content: [
          `Primary question: ${prompt}`,
          `Topic cluster: ${topic}`,
          'Requirements:',
          '- Language: English.',
          '- Length: 1100 to 1600 words.',
          '- Include an intro, at least 5 H2 sections, one comparison/table section written in markdown, and a short conclusion.',
          '- Keep claims realistic and avoid invented statistics.',
          '- Mention use-cases for Instagram, X and YouTube where relevant.',
          '- Keep a helpful and editorial tone, not salesy.',
          '- Return valid JSON only.',
        ].join('\n'),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Réponse vide lors de la génération de l article');
  }

  const parsed = JSON.parse(cleanJsonPayload(raw));
  return normalizeGeneratedArticle(parsed);
}

export async function createBlogArticleFromQueue(
  queueItem: BlogQueueItem,
  article: GeneratedBlogArticle
): Promise<{ id: number; slug: string }> {
  const autoPublish = (process.env.BLOG_AUTO_PUBLISH ?? 'true').toLowerCase() === 'true';
  const baseSlug = article.slug;

  for (let i = 0; i < 20; i += 1) {
    const slug = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const result = await pool.query(
      `INSERT INTO blog_articles (
         queue_id,
         prompt,
         topic,
         title,
         slug,
         excerpt,
         meta_description,
         content_markdown,
         target_keywords,
         is_published,
         published_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $10 THEN NOW() ELSE NULL END)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, slug`,
      [
        queueItem.id,
        queueItem.prompt,
        queueItem.topic,
        article.title,
        slug,
        article.excerpt,
        article.metaDescription,
        article.contentMarkdown,
        article.targetKeywords,
        autoPublish,
      ]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
  }

  throw new Error('Impossible de créer un slug unique pour l article');
}
