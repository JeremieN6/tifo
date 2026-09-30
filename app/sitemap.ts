import type { MetadataRoute } from 'next';
import { readdir } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { getPublishedBlogSlugs } from '@/lib/blog';
import { getSiteUrl } from '@/lib/seo';

const APP_DIR = join(process.cwd(), 'app');

// Routes protégées par le middleware next-auth (voir middleware.ts) : elles
// redirigent systématiquement vers /api/auth/signin pour un visiteur non
// connecté et ne sont donc jamais crawlables.
const AUTH_PROTECTED_SEGMENTS = ['create', 'dashboard', 'account'];

const EXCLUDED_SEGMENTS = new Set([
  'api',
  'admin',
  ...AUTH_PROTECTED_SEGMENTS,
  '_components',
  '_lib',
  '_utils',
]);

function isIgnoredSegment(segment: string): boolean {
  // Skip route groups, private folders and dynamic segments.
  return (
    EXCLUDED_SEGMENTS.has(segment) ||
    segment.startsWith('(') ||
    segment.startsWith('_') ||
    (segment.startsWith('[') && segment.endsWith(']'))
  );
}

async function collectStaticRoutes(dir: string, segments: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: string[] = [];

  const hasPageFile = entries.some((entry) => entry.isFile() && entry.name === 'page.tsx');

  if (hasPageFile) {
    const pathname = segments.length === 0 ? '/' : `/${posix.join(...segments)}`;
    routes.push(pathname);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (isIgnoredSegment(entry.name)) {
      continue;
    }

    const childRoutes = await collectStaticRoutes(join(dir, entry.name), [...segments, entry.name]);
    routes.push(...childRoutes);
  }

  return routes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const routes = await collectStaticRoutes(APP_DIR);
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    const blogSlugs = await getPublishedBlogSlugs(1000);
    blogRoutes = blogSlugs.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.published_at ?? post.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('[sitemap/blog]', error);
  }

  const staticRoutes = routes
    .filter((route, index, all) => all.indexOf(route) === index)
    .sort((a, b) => a.localeCompare(b))
    .map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '/' ? 1 : 0.7,
    }));

  return [...staticRoutes, ...blogRoutes];
}
