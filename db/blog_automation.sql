CREATE TABLE IF NOT EXISTS blog_article_queue (
  id BIGSERIAL PRIMARY KEY,
  prompt TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'seed',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  picked_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT blog_article_queue_status_check CHECK (status IN ('pending', 'processing', 'done', 'error')),
  CONSTRAINT blog_article_queue_source_check CHECK (source IN ('seed', 'auto_weekly'))
);

CREATE INDEX IF NOT EXISTS idx_blog_article_queue_status ON blog_article_queue (status, id);
CREATE INDEX IF NOT EXISTS idx_blog_article_queue_source_created ON blog_article_queue (source, created_at DESC);

CREATE TABLE IF NOT EXISTS blog_articles (
  id BIGSERIAL PRIMARY KEY,
  queue_id BIGINT REFERENCES blog_article_queue(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  target_keywords TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON blog_articles (is_published, published_at DESC, created_at DESC);
