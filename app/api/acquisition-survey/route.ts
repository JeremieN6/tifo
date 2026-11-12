import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isEligibleForSurvey, parseSurveyInput, saveSurvey } from '@/lib/acquisition';
import { captureServerEvent } from '@/lib/posthog-server';

// La question n'est proposee qu'une fois, apres une premiere generation reussie, et seulement
// aux comptes crees apres la mise en ligne (ceux qui ont une ligne user_attribution).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ eligible: false }, { status: 401 });
  }

  try {
    const eligible = await isEligibleForSurvey(session.user.id);
    return NextResponse.json({ eligible });
  } catch (err) {
    console.error('[acquisition-survey/get]', err);
    return NextResponse.json({ eligible: false });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const input = parseSurveyInput(await req.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  try {
    if (!(await isEligibleForSurvey(session.user.id))) {
      return NextResponse.json({ ok: true });
    }

    const saved = await saveSurvey(session.user.id, input);
    if (saved) {
      if (input.status === 'answered') {
        // Le texte libre reste en base : PostHog ne recoit que le canal choisi.
        captureServerEvent({
          distinctId: session.user.id,
          event: 'acquisition_survey_answered',
          properties: {
            channel: input.channel,
            has_query_text: Boolean(input.queryText),
            $set: { acquisition_channel: input.channel },
          },
        });
      } else {
        captureServerEvent({
          distinctId: session.user.id,
          event: 'acquisition_survey_dismissed',
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[acquisition-survey/post]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
