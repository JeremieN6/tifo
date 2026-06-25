import type { MetadataRoute } from 'next';

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  return (envUrl ?? 'https://example.com').replace(/\/$/, '');
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
