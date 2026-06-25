import type { MetadataRoute } from 'next';
import { readdir } from 'node:fs/promises';
import { join, posix } from 'node:path';

const APP_DIR = join(process.cwd(), 'app');

const EXCLUDED_SEGMENTS = new Set([
  'api',
  'admin',
  '_components',
  '_lib',
  '_utils',
]);

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  return (envUrl ?? 'https://example.com').replace(/\/$/, '');
}

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
  const baseUrl = getBaseUrl();
  const routes = await collectStaticRoutes(APP_DIR);

  return routes
    .filter((route, index, all) => all.indexOf(route) === index)
    .sort((a, b) => a.localeCompare(b))
    .map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: route === '/' ? 1 : 0.7,
    }));
}
