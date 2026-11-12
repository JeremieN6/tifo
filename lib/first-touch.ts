// Capture "first-touch" cote navigateur : d'ou arrive le visiteur la toute premiere fois.
// Rien d'identifiant n'est stocke (ni cookie tiers, ni identifiant) : uniquement la source,
// le domaine de provenance, le chemin d'arrivee (sans parametres) et le type d'appareil.

export type FirstTouch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_domain?: string;
  landing_path?: string;
  device_type?: 'mobile' | 'desktop';
  captured_at: number;
};

const STORAGE_KEY = 'tifo_first_touch';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hasSource(touch: FirstTouch): boolean {
  return Boolean(touch.utm_source || touch.referrer_domain);
}

export function readFirstTouch(): FirstTouch | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirstTouch;
    if (!parsed || typeof parsed.captured_at !== 'number') return null;
    if (Date.now() - parsed.captured_at > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function currentTouch(): FirstTouch {
  const params = new URLSearchParams(window.location.search);
  const pick = (key: string) => params.get(key)?.trim().slice(0, 100) || undefined;

  let referrerDomain: string | undefined;
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
      const ownHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
      if (host && host !== ownHost) referrerDomain = host;
    }
  } catch {
    // referrer illisible : on l'ignore
  }

  return {
    utm_source: pick('utm_source')?.toLowerCase(),
    utm_medium: pick('utm_medium')?.toLowerCase(),
    utm_campaign: pick('utm_campaign')?.toLowerCase(),
    referrer_domain: referrerDomain,
    landing_path: window.location.pathname,
    device_type: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    captured_at: Date.now(),
  };
}

// Premiere visite : on memorise. Si la premiere visite etait "directe" (aucune source) et qu'une
// visite suivante arrive avec une source (ex: lien ChatGPT), on la retient : c'est elle qui compte.
export function recordFirstTouch(): void {
  try {
    const touch = currentTouch();
    const stored = readFirstTouch();
    if (!stored || (!hasSource(stored) && hasSource(touch))) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(touch));
    }
  } catch {
    // stockage indisponible (navigation privee, etc.) : sans effet sur le site
  }
}
