import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { upgradePlan } from '@/lib/billing';

export async function handleStripeWebhook(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret || !stripeSecretKey) {
      console.error('[webhook/stripe] STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY manquant.');
      return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 500 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature Stripe manquante.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userEmail = session.customer_details?.email ?? session.customer_email;
    const amount = session.amount_total ?? 0;

    if (!userEmail || !amount) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
    }

    let plan: 'pro' | 'club' | null = null;
    if (amount === 900) plan = 'pro';
    else if (amount === 2900) plan = 'club';

    if (!plan) {
      console.warn('[webhook/stripe] Montant inconnu:', amount);
      return NextResponse.json({ received: true });
    }

    await upgradePlan(userEmail, plan, event.id, amount);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/stripe]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}