import { NextRequest, NextResponse } from 'next/server';
import { upgradePlan } from '@/lib/billing';

// Stripe webhook via payment links NanoCorp
// Montants : 900 = Pro (9€), 2900 = Club (29€)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { event_id, user_email, amount, currency, event_type } = body;

    if (!user_email || !amount) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
    }

    let plan: 'pro' | 'club' | null = null;
    if (amount === 900) plan = 'pro';
    else if (amount === 2900) plan = 'club';

    if (!plan) {
      console.warn('[webhook/nanocorp] Montant inconnu:', amount);
      return NextResponse.json({ received: true });
    }

    await upgradePlan(user_email, plan, event_id ?? `manual_${Date.now()}`, amount);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/nanocorp]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
