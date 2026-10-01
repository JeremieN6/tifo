import pool from './db';

export type BlogArticlePreview = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  topic: string;
  published_at: string | null;
  created_at: string;
};

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogArticle = BlogArticlePreview & {
  content_markdown: string;
  meta_description: string;
  target_keywords: string[];
  prompt: string;
  faq_json: BlogFaqItem[] | null;
  is_published: boolean;
};

export async function getPublishedBlogArticles(limit = 50): Promise<BlogArticlePreview[]> {
  const result = await pool.query(
    `SELECT id, title, slug, excerpt, topic, published_at, created_at
     FROM blog_articles
     WHERE is_published = true
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

const ARTICLE_COLUMNS = `
      id,
      title,
      slug,
      excerpt,
      topic,
      published_at,
      created_at,
      content_markdown,
      meta_description,
      target_keywords,
      prompt,
      faq_json,
      is_published`;

export async function getPublishedBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const result = await pool.query(
    `SELECT ${ARTICLE_COLUMNS}
     FROM blog_articles
     WHERE slug = $1 AND is_published = true
     LIMIT 1`,
    [slug]
  );

  return result.rows[0] ?? null;
}

/**
 * Ignore le filtre is_published — reserve a la previsualisation admin
 * (app/blog/[slug]/page.tsx verifie isAdmin avant d'appeler cette fonction).
 * Jamais utilisee sur un chemin accessible au public.
 */
export async function getAnyBlogArticleBySlugForAdmin(slug: string): Promise<BlogArticle | null> {
  const result = await pool.query(
    `SELECT ${ARTICLE_COLUMNS}
     FROM blog_articles
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );

  return result.rows[0] ?? null;
}

export async function getPublishedBlogSlugs(limit = 500): Promise<Array<{ slug: string; published_at: string | null; created_at: string }>> {
  const result = await pool.query(
    `SELECT slug, published_at, created_at
     FROM blog_articles
     WHERE is_published = true
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}
