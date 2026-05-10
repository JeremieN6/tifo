import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get('team');

  if (!team || team.trim().length === 0) {
    return NextResponse.json({ error: 'Paramètre team requis.' }, { status: 400 });
  }

  try {
    const encoded = encodeURIComponent(team.trim());
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encoded}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return NextResponse.json({ teams: [] });
    }

    const data = await response.json();
    const teams = (data.teams ?? []).slice(0, 5).map((t: Record<string, string>) => ({
      id: t.idTeam,
      name: t.strTeam,
      logo: t.strTeamBadge,
      country: t.strCountry,
      league: t.strLeague,
    }));

    return NextResponse.json({ teams });
  } catch (err) {
    console.error('[search-team]', err);
    return NextResponse.json({ teams: [] });
  }
}
