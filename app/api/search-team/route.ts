import { NextRequest, NextResponse } from 'next/server';

interface WikidataSearchResult {
  id: string;
  label?: string;
  description?: string;
  aliases?: string[];
}

interface WikidataEntity {
  claims?: Record<string, Array<{
    mainsnak?: {
      datavalue?: {
        value?: string;
      };
    };
  }>>;
}

const CLUB_DESCRIPTION_PATTERNS = [
  'association football club',
  'football club',
  'soccer club',
  'club de football',
  'club de soccer',
  'football team',
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isClubResult(result: WikidataSearchResult) {
  const description = result.description?.toLowerCase() ?? '';
  return CLUB_DESCRIPTION_PATTERNS.some((pattern) => description.includes(pattern));
}

function scoreResult(result: WikidataSearchResult, rawQuery: string) {
  const query = normalize(rawQuery);
  const label = normalize(result.label ?? '');
  const aliases = (result.aliases ?? []).map(normalize);
  const queryTokens = query.split(' ').filter(Boolean);
  let score = 0;

  if (isClubResult(result)) score += 200;
  if (label === query) score += 120;
  else if (label.startsWith(query)) score += 80;
  else if (query && label.includes(query)) score += 50;

  for (const alias of aliases) {
    if (alias === query) score += 110;
    else if (alias.startsWith(query)) score += 70;
    else if (query && alias.includes(query)) score += 40;
  }

  if (queryTokens.length > 0) {
    const haystack = [label, ...aliases].join(' ');
    const matchingTokens = queryTokens.filter((token) => haystack.includes(token)).length;
    score += matchingTokens * 15;
  }

  return score;
}

function buildCommonsFileUrl(fileName?: string) {
  if (!fileName) return '';
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function getClaimFileName(entity: WikidataEntity | undefined, property: string) {
  const value = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : '';
}

async function searchWikidata(term: string) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'en');
  url.searchParams.set('uselang', 'en');
  url.searchParams.set('type', 'item');
  url.searchParams.set('limit', '20');
  url.searchParams.set('search', term);

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    return [] as WikidataSearchResult[];
  }

  const data = await response.json();
  return (data.search ?? []) as WikidataSearchResult[];
}

async function fetchEntityMedia(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action', 'wbgetentities');
  url.searchParams.set('format', 'json');
  url.searchParams.set('props', 'claims');
  url.searchParams.set('ids', ids.join('|'));

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    return new Map<string, string>();
  }

  const data = await response.json();
  const entities = (data.entities ?? {}) as Record<string, WikidataEntity>;
  const mediaById = new Map<string, string>();

  for (const id of ids) {
    const entity = entities[id];
    const fileName = getClaimFileName(entity, 'P154');
    mediaById.set(id, buildCommonsFileUrl(fileName));
  }

  return mediaById;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get('team');

  if (!team || team.trim().length === 0) {
    return NextResponse.json({ error: 'Paramètre team requis.' }, { status: 400 });
  }

  try {
    const query = team.trim();
    const searchTerms = [query];

    if (!/\b(fc|ac|sc|osc|football club)\b/i.test(query)) {
      searchTerms.push(`${query} fc`, `${query} football club`);
    }

    const rankedResults = new Map<string, WikidataSearchResult & { score: number }>();

    for (const term of searchTerms) {
      const results = await searchWikidata(term);

      for (const result of results) {
        if (!isClubResult(result)) {
          continue;
        }

        const score = scoreResult(result, query);
        const current = rankedResults.get(result.id);

        if (!current || score > current.score) {
          rankedResults.set(result.id, { ...result, score });
        }
      }

      if (rankedResults.size >= 5) {
        break;
      }
    }

    const topResults = Array.from(rankedResults.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);

    const mediaById = await fetchEntityMedia(topResults.map((result) => result.id));
    const teams = topResults.map((result) => ({
      id: result.id,
      name: result.label ?? '',
      logo: mediaById.get(result.id) ?? '',
      country: '',
      league: '',
    }));

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[search-team]', err);
    return NextResponse.json({ teams: [] });
  }
}
