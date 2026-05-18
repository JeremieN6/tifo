import { NextRequest, NextResponse } from 'next/server';

interface WikidataSearchResult {
  id: string;
  label?: string;
  description?: string;
  aliases?: string[];
}

interface SportsDbTeam {
  strTeam?: string;
  strTeamAlternate?: string;
  strBadge?: string;
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

interface ApiFootballTeamResponse {
  response?: Array<{
    team?: {
      name?: string;
      logo?: string;
    };
  }>;
}

const CLUB_DESCRIPTION_PATTERNS = [
  'association football club',
  'football club',
  'soccer club',
  'club de football',
  'club de soccer',
  'football team',
];

const CLUB_NAME_STOP_WORDS = new Set([
  'ac',
  'afc',
  'as',
  'association',
  'athletique',
  'cf',
  'club',
  'es',
  'fc',
  'football',
  'osc',
  'sc',
  'soccer',
  'sporting',
  'ss',
  'team',
  'us',
]);

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY ?? process.env.APISPORTS_KEY ?? '';
const RAPID_API_KEY = process.env.RAPIDAPI_KEY ?? '';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function simplifyClubName(value: string) {
  return normalize(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !CLUB_NAME_STOP_WORDS.has(token));
}

function splitAlternativeNames(value?: string) {
  return (value ?? '')
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildCommonsFileUrl(fileName?: string) {
  if (!fileName) {
    return '';
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function getClaimFileName(entity: WikidataEntity | undefined, property: string) {
  const value = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : '';
}

function isSameClub(candidateName: string | undefined, expectedNames: string[]) {
  if (!candidateName) {
    return false;
  }

  const candidateNormalized = normalize(candidateName);
  const candidateTokens = simplifyClubName(candidateName);

  return expectedNames.some((expectedName) => {
    const expectedNormalized = normalize(expectedName);
    const expectedTokens = simplifyClubName(expectedName);

    if (candidateNormalized === expectedNormalized) {
      return true;
    }

    if (expectedTokens.length === 0 || candidateTokens.length === 0) {
      return false;
    }

    const expectedCovered = expectedTokens.every((token) => candidateTokens.includes(token));
    const candidateCovered = candidateTokens.every((token) => expectedTokens.includes(token));
    return expectedCovered || candidateCovered;
  });
}

function buildNameCandidates(result: WikidataSearchResult) {
  const rawNames = dedupe([result.label ?? '', ...(result.aliases ?? [])]);
  const variants: string[] = [];

  for (const rawName of rawNames) {
    const trimmedName = rawName.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (!trimmedName) {
      continue;
    }

    variants.push(trimmedName);

    if (/\bfootball club\b/i.test(trimmedName)) {
      variants.push(trimmedName.replace(/\bfootball club\b/gi, 'FC').replace(/\s+/g, ' ').trim());
    }

    if (/\bfc\b/i.test(trimmedName)) {
      variants.push(trimmedName.replace(/\bfc\b/gi, 'Football Club').replace(/\s+/g, ' ').trim());
    }

    const simplifiedName = simplifyClubName(trimmedName).join(' ');
    if (simplifiedName) {
      variants.push(simplifiedName);
    }
  }

  return dedupe(variants);
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

async function fetchSportsDbLogo(nameCandidates: string[]) {
  for (const candidate of nameCandidates) {
    try {
      const url = new URL('https://www.thesportsdb.com/api/v1/json/3/searchteams.php');
      url.searchParams.set('t', candidate);

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const teams = (data.teams ?? []) as SportsDbTeam[];
      const match = teams.find((team) => {
        const providerNames = [team.strTeam ?? '', ...splitAlternativeNames(team.strTeamAlternate)];
        return providerNames.some((providerName) => isSameClub(providerName, nameCandidates)) && !!team.strBadge;
      });

      if (match?.strBadge) {
        return match.strBadge;
      }
    } catch {
      continue;
    }
  }

  return '';
}

async function fetchApiFootballLogo(nameCandidates: string[]) {
  if (!API_FOOTBALL_KEY && !RAPID_API_KEY) {
    return '';
  }

  const useRapidApi = !API_FOOTBALL_KEY && !!RAPID_API_KEY;
  const baseUrl = useRapidApi
    ? 'https://api-football-v1.p.rapidapi.com/v3/teams'
    : 'https://v3.football.api-sports.io/teams';
  const headers: Record<string, string> = useRapidApi
    ? {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      }
    : {
        'x-apisports-key': API_FOOTBALL_KEY,
      };

  for (const candidate of nameCandidates) {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('search', candidate);

      const response = await fetch(url, {
        cache: 'no-store',
        headers,
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as ApiFootballTeamResponse;
      const match = (data.response ?? []).find((entry) => {
        return isSameClub(entry.team?.name, nameCandidates) && !!entry.team?.logo;
      });

      if (match?.team?.logo) {
        return match.team.logo;
      }
    } catch {
      continue;
    }
  }

  return '';
}

async function fetchWikidataLogos(ids: string[]) {
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
  const logoById = new Map<string, string>();

  for (const id of ids) {
    logoById.set(id, buildCommonsFileUrl(getClaimFileName(entities[id], 'P154')));
  }

  return logoById;
}

async function resolveTeamLogo(result: WikidataSearchResult, wikidataLogo = '') {
  const nameCandidates = buildNameCandidates(result);

  if (nameCandidates.length === 0) {
    return wikidataLogo;
  }

  return (await fetchSportsDbLogo(nameCandidates)) || (await fetchApiFootballLogo(nameCandidates)) || wikidataLogo;
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

    const wikidataLogos = await fetchWikidataLogos(topResults.map((result) => result.id));

    const teams = await Promise.all(topResults.map(async (result) => ({
      id: result.id,
      name: result.label ?? '',
      logo: await resolveTeamLogo(result, wikidataLogos.get(result.id) ?? ''),
      country: '',
      league: '',
    })));

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[search-team]', err);
    return NextResponse.json({ teams: [] });
  }
}
