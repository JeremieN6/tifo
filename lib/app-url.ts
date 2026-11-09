import type { NextRequest } from 'next/server';

function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(url);
}

// Origine publique du site (ex: https://tifo.example). Derriere nginx, req.url et
// req.nextUrl.origin valent l'adresse interne (http://localhost:3000) : on ne peut pas
// s'en servir pour construire des liens de redirection ou des URLs de retour Stripe.
export function getPublicOrigin(req: NextRequest): string {
  const configured = [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL]
    .map((value) => value?.trim().replace(/\/$/, ''))
    .filter((value): value is string => Boolean(value));

  const isProduction = process.env.NODE_ENV === 'production';
  const publicConfigured = configured.find((value) => !isProduction || !isLocalUrl(value));
  if (publicConfigured) return publicConfigured;

  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (forwardedHost && !isLocalUrl(`http://${forwardedHost}`)) {
    const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https';
    return `${forwardedProto.split(',')[0].trim()}://${forwardedHost}`;
  }

  return configured[0] ?? req.nextUrl.origin;
}

export function publicUrl(req: NextRequest, path: string): URL {
  return new URL(path, getPublicOrigin(req));
}
