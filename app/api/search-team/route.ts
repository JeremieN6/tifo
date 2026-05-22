import { NextRequest, NextResponse } from 'next/server';

interface WikidataSearchResult {
  id: string;
  label?: string;
  description?: string;
  aliases?: string[];
}

interface LeagueRecord {
  leagueid?: string | number;
  league_name?: string;
  league?: string;
  country_name?: string;
  country?: string;
  [key: string]: unknown;
}

interface TeamRecord {
  teamid?: string | number;
  team_name?: string;
  team?: string;
  team_logo?: string;
  team_badge?: string;
  logo?: string;
  badge?: string;
  [key: string]: unknown;
}

interface TeamDetailResponse {
  response?: Array<{
    team?: {
      id?: string | number;
      name?: string;
      logo?: string;
      badge?: string;
    };
    league?: {
      id?: string | number;
      name?: string;
      logo?: string;
      country?: string;
    };
  }>;
  data?: {
    team?: {
      id?: string | number;
      name?: string;
      logo?: string;
      badge?: string;
    };
  };
}

const RAPID_HOST = 'free-api-live-football-data.p.rapidapi.com';
const RAPID_KEY = process.env.RAPIDAPI_KEY ?? '';
const APIFOOTBALL_HOST = 'v3.football.api-sports.io';
const APIFOOTBALL_KEY = process.env.API_FOOTBALL_KEY ?? '';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LEAGUE_FETCH_LIMIT = 20;
const TEAM_FETCH_LIMIT = 20;

const WIKIDATA_CLUB_PATTERNS = [
  'association football club',
  'football club',
  'soccer club',
  'club de football',
  'club de soccer',
  'football team',
];

const MATCH_STOP_WORDS = new Set([
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

const NON_MEN_VARIANTS = [
  'women',
  'womens',
  'women s',
  'female',
  'feminine',
  'ladies',
  'girls',
  'b team',
  'ii',
  'iii',
  'u19',
  'u20',
  'u21',
  'reserve',
  'reserves',
  'academy',
];

type CacheEntry<T> = { value: T; expiresAt: number };

type TeamResolution = {
  teamId: string;
  logo: string;
  source: 'league-team' | 'team-detail';
};

type TeamSearchItem = {
  id: string;
  name: string;
  logo: string;
  country: string;
  league: string;
};

type ApiFootballTeamItem = {
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  venue?: {
    city?: string;
  };
  league?: {
    id?: number;
    name?: string;
    country?: string;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __tifoRapidTeamCache:
    | {
        leagues: CacheEntry<LeagueRecord[]> | null;
        leagueTeams: Map<string, CacheEntry<TeamRecord[]>>;
        teamResolutions: Map<string, CacheEntry<TeamResolution>>;
        apiFootballSearch: Map<string, CacheEntry<TeamSearchItem[]>>;
      }
    | undefined;
}

const caches = globalThis.__tifoRapidTeamCache ?? {
  leagues: null,
  leagueTeams: new Map<string, CacheEntry<TeamRecord[]>>(),
  teamResolutions: new Map<string, CacheEntry<TeamResolution>>(),
  apiFootballSearch: new Map<string, CacheEntry<TeamSearchItem[]>>(),
};

globalThis.__tifoRapidTeamCache = caches;

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

function simplifyTokens(value: string) {
  return normalize(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !MATCH_STOP_WORDS.has(token));
}

function hasNonMenVariant(value: string) {
  const normalized = normalize(value);
  return NON_MEN_VARIANTS.some((variant) => normalized.includes(variant));
}

function resultHasNonMenVariant(result: WikidataSearchResult) {
  const fields = [result.label ?? '', ...(result.aliases ?? [])];
  return fields.some((field) => hasNonMenVariant(field));
}

function queryWantsNonMenVariant(query: string) {
  return hasNonMenVariant(query);
}

function extractSearchTerms(result: WikidataSearchResult) {
  const candidates = dedupe([result.label ?? '', ...(result.aliases ?? [])]);
  const variants: string[] = [];

  for (const candidate of candidates) {
    const cleaned = candidate.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;

    variants.push(cleaned);
    variants.push(normalize(cleaned));

    if (/\bfootball club\b/i.test(cleaned)) {
      variants.push(cleaned.replace(/\bfootball club\b/gi, 'FC').replace(/\s+/g, ' ').trim());
    }

    if (/\bfc\b/i.test(cleaned)) {
      variants.push(cleaned.replace(/\bfc\b/gi, 'Football Club').replace(/\s+/g, ' ').trim());
    }
  }

  return dedupe(variants);
}

function extractLocationHints(result: WikidataSearchResult) {
  const hints: string[] = [];
  const description = result.description ?? '';

  const inMatch = description.match(/\bin\s+([^.;]+)/i);
  if (inMatch?.[1]) {
    const tailParts = inMatch[1].split(',').map((part) => part.trim()).filter(Boolean);
    if (tailParts.length > 0) {
      hints.push(...tailParts.slice(-2));
    }
  }

  const commaParts = description.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) {
    hints.push(commaParts[commaParts.length - 1]);
    hints.push(commaParts[commaParts.length - 2]);
  }

  return dedupe(hints.map(normalize).filter(Boolean));
}

function isClubResult(result: WikidataSearchResult) {
  const description = result.description?.toLowerCase() ?? '';
  return WIKIDATA_CLUB_PATTERNS.some((pattern) => description.includes(pattern));
}

function buildNameScore(candidate: string, result: WikidataSearchResult) {
  const candidateNormalized = normalize(candidate);
  const candidateTokens = simplifyTokens(candidate);
  const labelNormalized = normalize(result.label ?? '');
  const labelTokens = simplifyTokens(result.label ?? '');
  let score = 0;

  if (candidateNormalized === labelNormalized) score += 120;
  else if (candidateNormalized.startsWith(labelNormalized) || labelNormalized.startsWith(candidateNormalized)) score += 80;
  else if (candidateNormalized.includes(labelNormalized) || labelNormalized.includes(candidateNormalized)) score += 50;

  if (candidateTokens.length > 0 && labelTokens.length > 0) {
    const overlap = candidateTokens.filter((token) => labelTokens.includes(token)).length;
    score += overlap * 20;
  }

  if (/\bwomen|ladies|reserve|u19|u21|academy|b team|ii|iii\b/i.test(candidate)) {
    score -= 40;
  }

  return score;
}

function buildLeagueScore(league: LeagueRecord, hints: string[]) {
  const leagueName = normalize(String(league.league_name ?? league.league ?? ''));
  const leagueCountry = normalize(String(league.country_name ?? league.country ?? ''));
  let score = 0;

  for (const hint of hints) {
    if (!hint) continue;
    if (leagueName.includes(hint)) score += 40;
    if (leagueCountry.includes(hint)) score += 60;
  }

  return score;
}

function isFresh<T>(entry: CacheEntry<T> | null | undefined) {
  return !!entry && entry.expiresAt > Date.now();
}

async function rapidFetchJson(path: string, searchParams?: Record<string, string>) {
  if (!RAPID_KEY) {
    throw new Error('RAPIDAPI_KEY missing');
  }

  const url = new URL(`https://${RAPID_HOST}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'x-rapidapi-key': RAPID_KEY,
      'x-rapidapi-host': RAPID_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`RapidAPI request failed: ${response.status}`);
  }

  return response.json();
}

async function apiFootballFetchJson(path: string, searchParams?: Record<string, string>) {
  if (!APIFOOTBALL_KEY) {
    throw new Error('API_FOOTBALL_KEY missing');
  }

  const url = new URL(`https://${APIFOOTBALL_HOST}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'x-apisports-key': APIFOOTBALL_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status}`);
  }

  return response.json();
}

function extractArray<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.response, record.data, record.teams, record.leagues, record.items];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function toLeagueRecord(item: unknown): LeagueRecord {
  return (item as LeagueRecord) ?? {};
}

function toTeamRecord(item: unknown): TeamRecord {
  return (item as TeamRecord) ?? {};
}

function getLeagueId(league: LeagueRecord) {
  return String(league.leagueid ?? league['league_id'] ?? league['id'] ?? '').trim();
}

function getTeamId(team: TeamRecord) {
  return String(team.teamid ?? team['team_id'] ?? team['id'] ?? '').trim();
}

function getTeamName(team: TeamRecord) {
  return String(team.team_name ?? team.team ?? team['name'] ?? '').trim();
}

function getTeamLogo(team: TeamRecord) {
  return String(team.team_logo ?? team.team_badge ?? team.logo ?? team.badge ?? '').trim();
}

async function getLeagueCatalog() {
  if (isFresh(caches.leagues)) {
    return caches.leagues!.value;
  }

  const collected: LeagueRecord[] = [];
  const endpoints = [
    { path: '/football-popular-leagues' },
    { path: '/football-get-all-leagues' },
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await rapidFetchJson(endpoint.path);
      const records = extractArray<LeagueRecord>(payload).map(toLeagueRecord);
      collected.push(...records);
    } catch {
      continue;
    }
  }

  const unique = new Map<string, LeagueRecord>();
  for (const league of collected) {
    const leagueId = getLeagueId(league);
    if (!leagueId) continue;
    if (!unique.has(leagueId)) {
      unique.set(leagueId, league);
    }
  }

  const leagues = Array.from(unique.values());
  caches.leagues = { value: leagues, expiresAt: Date.now() + CACHE_TTL_MS };
  return leagues;
}

async function getTeamsForLeague(leagueId: string) {
  const cached = caches.leagueTeams.get(leagueId);
  if (isFresh(cached)) {
    return cached!.value;
  }

  const endpoints = [
    '/football-get-list-all-team',
    '/football-get-teams-by-league',
  ];

  for (const path of endpoints) {
    try {
      const payload = await rapidFetchJson(path, { leagueid: leagueId });
      const teams = extractArray<TeamRecord>(payload).map(toTeamRecord);
      if (teams.length > 0) {
        caches.leagueTeams.set(leagueId, { value: teams, expiresAt: Date.now() + CACHE_TTL_MS });
        return teams;
      }
    } catch {
      continue;
    }
  }

  caches.leagueTeams.set(leagueId, { value: [], expiresAt: Date.now() + 60 * 60 * 1000 });
  return [] as TeamRecord[];
}

async function getTeamDetailLogo(teamId: string) {
  const endpoints = [
    '/football-league-team',
    '/football-team-detail',
  ];

  for (const path of endpoints) {
    try {
      const payload = await rapidFetchJson(path, { teamid: teamId });
      const records = extractArray<NonNullable<TeamDetailResponse['response']>[number]>(payload as TeamDetailResponse);
      for (const record of records) {
        const team = record?.team;
        const logo = String(team?.logo ?? team?.badge ?? '').trim();
        if (logo) {
          return logo;
        }
      }

      const data = payload as TeamDetailResponse;
      const teamLogo = String(data.data?.team?.logo ?? data.data?.team?.badge ?? '').trim();
      if (teamLogo) {
        return teamLogo;
      }
    } catch {
      continue;
    }
  }

  return '';
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

function getCandidates(result: WikidataSearchResult) {
  return dedupe([
    ...extractSearchTerms(result),
    ...(result.aliases ?? []).map((alias) => alias.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()),
  ]);
}

function buildSearchResultScore(result: WikidataSearchResult, rawQuery: string) {
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

  if (resultHasNonMenVariant(result) && !queryWantsNonMenVariant(rawQuery)) {
    score -= 140;
  }

  return score;
}

function pickLeagueCandidates(leagues: LeagueRecord[], hints: string[]) {
  const scored = leagues
    .map((league) => ({ league, score: buildLeagueScore(league, hints) }))
    .sort((left, right) => right.score - left.score);

  const prioritized = scored.filter((item) => item.score > 0).map((item) => item.league);
  const rest = scored.filter((item) => item.score <= 0).map((item) => item.league);
  return [...prioritized, ...rest].slice(0, LEAGUE_FETCH_LIMIT);
}

async function resolveTeamId(result: WikidataSearchResult) {
  const candidates = getCandidates(result);
  const cacheKey = candidates.map(normalize).sort().join('|');
  const cached = caches.teamResolutions.get(cacheKey);
  if (isFresh(cached)) {
    return cached!.value;
  }

  const locationHints = extractLocationHints(result);
  const leagues = await getLeagueCatalog();
  const candidateLeagues = pickLeagueCandidates(leagues, locationHints);

  for (const league of candidateLeagues) {
    const leagueId = getLeagueId(league);
    if (!leagueId) continue;

    const teams = await getTeamsForLeague(leagueId);
    for (const team of teams.slice(0, TEAM_FETCH_LIMIT)) {
      const teamId = getTeamId(team);
      const teamName = getTeamName(team);
      if (!teamId || !teamName) continue;

      if (!candidates.some((candidate) => {
        const candidateScore = buildNameScore(candidate, result);
        if (candidateScore < 20) {
          return false;
        }

        const teamNormalized = normalize(teamName);
        const candidateNormalized = normalize(candidate);
        if (teamNormalized === candidateNormalized) {
          return true;
        }

        const teamTokens = simplifyTokens(teamName);
        const candidateTokens = simplifyTokens(candidate);
        if (teamTokens.length === 0 || candidateTokens.length === 0) {
          return false;
        }

        const overlap = candidateTokens.filter((token) => teamTokens.includes(token)).length;
        if (overlap === 0) {
          return false;
        }

        const isNonMen = hasNonMenVariant(teamName);
        const wantsNonMen = hasNonMenVariant(candidate);
        if (isNonMen && !wantsNonMen) {
          return false;
        }

        return overlap >= Math.min(2, candidateTokens.length);
      })) {
        continue;
      }

      const logo = getTeamLogo(team) || (await getTeamDetailLogo(teamId));
      const resolution = { teamId, logo, source: 'league-team' as const };
      caches.teamResolutions.set(cacheKey, { value: resolution, expiresAt: Date.now() + CACHE_TTL_MS });
      return resolution;
    }
  }

  return null;
}

function scoreByQuery(name: string, query: string) {
  const normalizedName = normalize(name);
  const normalizedQuery = normalize(query);

  if (!normalizedName || !normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 300;
  if (normalizedName.startsWith(normalizedQuery)) return 220;
  if (normalizedName.includes(normalizedQuery)) return 170;

  const nameTokens = simplifyTokens(normalizedName);
  const queryTokens = simplifyTokens(normalizedQuery);
  const overlap = queryTokens.filter((token) => nameTokens.includes(token)).length;
  return overlap * 40;
}

async function searchApiFootballTeams(rawQuery: string): Promise<TeamSearchItem[]> {
  const query = rawQuery.trim();
  if (!query || query.length < 3 || !APIFOOTBALL_KEY) {
    return [];
  }

  const cacheKey = normalize(query);
  const cached = caches.apiFootballSearch.get(cacheKey);
  if (isFresh(cached)) {
    return cached!.value;
  }

  try {
    const payload = await apiFootballFetchJson('/teams', { search: query });
    const responseArray = Array.isArray((payload as { response?: unknown[] }).response)
      ? ((payload as { response: unknown[] }).response as ApiFootballTeamItem[])
      : [];

    const wantsNonMen = queryWantsNonMenVariant(query);
    const mapped = responseArray
      .map((item) => {
        const name = String(item.team?.name ?? '').trim();
        const id = String(item.team?.id ?? '').trim();
        const logo = String(item.team?.logo ?? '').trim();
        const country = String(item.league?.country ?? '').trim();
        const league = String(item.league?.name ?? '').trim();

        return {
          id: id ? `api-football-${id}` : `api-football-${normalize(name)}`,
          name,
          logo,
          country,
          league,
        } as TeamSearchItem;
      })
      .filter((item) => item.name.length > 0)
      .filter((item) => wantsNonMen || !hasNonMenVariant(item.name))
      .map((item) => ({ item, score: scoreByQuery(item.name, query) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.item)
      .slice(0, 8);

    caches.apiFootballSearch.set(cacheKey, { value: mapped, expiresAt: Date.now() + CACHE_TTL_MS });
    return mapped;
  } catch {
    caches.apiFootballSearch.set(cacheKey, { value: [], expiresAt: Date.now() + 10 * 60 * 1000 });
    return [];
  }
}

function mergeTeamResults(primary: TeamSearchItem[], fallback: TeamSearchItem[]) {
  const merged = new Map<string, TeamSearchItem>();

  for (const item of [...primary, ...fallback]) {
    const key = normalize(item.name);
    if (!key) continue;

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }

    if (!existing.logo && item.logo) {
      merged.set(key, item);
    }
  }

  return Array.from(merged.values());
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

        const score = buildSearchResultScore(result, query);
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

    const preferredResults = queryWantsNonMenVariant(query)
      ? topResults
      : topResults.filter((result) => !resultHasNonMenVariant(result));

    const finalResults = preferredResults.length > 0 ? preferredResults : topResults;

    const wikidataTeams = await Promise.all(finalResults.map(async (result) => {
      const resolution = await resolveTeamId(result);

      return {
        id: result.id,
        name: result.label ?? '',
        logo: resolution?.logo ?? '',
        country: '',
        league: '',
      } as TeamSearchItem;
    }));

    const apiFootballTeams = await searchApiFootballTeams(query);
    const teams = mergeTeamResults(apiFootballTeams, wikidataTeams);

    if (teams.length === 0) {
      return NextResponse.json({ teams: wikidataTeams });
    }

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[search-team]', err);
    return NextResponse.json({ teams: [] });
  }
}