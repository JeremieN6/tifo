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

export type BlogArticle = BlogArticlePreview & {
  content_markdown: string;
  meta_description: string;
  target_keywords: string[];
  prompt: string;
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

export async function getPublishedBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const result = await pool.query(
    `SELECT
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
      prompt
     FROM blog_articles
     WHERE slug = $1 AND is_published = true
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
