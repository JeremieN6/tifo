const DEFAULT_SITE_URL = 'https://example.com';

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
  return (envUrl ?? DEFAULT_SITE_URL).replace(/\/$/, '');
}

export function canonicalUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${path}`;
}
