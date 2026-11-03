import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cancelPlan, getUserByStripeCustomerId, setStripeCustomerId, upgradePlan } from '@/lib/billing';
import { captureServerEvent } from '@/lib/posthog-server';

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

    if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(stripe, event.data.object as Stripe.Subscription);
      return NextResponse.json({ received: true });
    }

    if (event.type === 'invoice.payment_failed') {
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      return NextResponse.json({ received: true });
    }

    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userEmail = session.customer_details?.email ?? session.customer_email;
    const amount = session.amount_total ?? 0;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;

    if (!userEmail || !amount) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
    }

    const metadataPlan = session.metadata?.plan;
    let plan: 'pro' | 'club' | null = null;
    if (metadataPlan === 'pro' || metadataPlan === 'club') {
      plan = metadataPlan;
    } else if (amount === 900) {
      plan = 'pro';
    } else if (amount === 2900) {
      plan = 'club';
    }

    if (!plan) {
      console.warn('[webhook/stripe] Montant inconnu:', amount);
      return NextResponse.json({ received: true });
    }

    if (stripeCustomerId) {
      await setStripeCustomerId(userEmail, stripeCustomerId);
    }

    await upgradePlan(userEmail, plan, event.id, amount);

    captureServerEvent({
      distinctId: userEmail,
      event: 'subscription_activated',
      properties: {
        plan,
        amount,
      },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/stripe]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

// Fin d'abonnement cote Stripe (resiliation via le portail client, ou annulation
// apres echec des relances de paiement) : on repasse le compte en Starter.
async function handleSubscriptionDeleted(stripe: Stripe, subscription: Stripe.Subscription) {
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) return;

  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.warn('[webhook/stripe] subscription.deleted pour un client inconnu:', customerId);
    return;
  }

  // Ne pas retrograder si le client a encore un autre abonnement en cours
  // (ex: ancien abonnement qui se termine apres un reabonnement).
  const others = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
  const stillSubscribed = others.data.some(
    (sub) => sub.id !== subscription.id && ['active', 'trialing', 'past_due'].includes(sub.status)
  );
  if (stillSubscribed) return;

  const previousPlan = user.plan;
  if (previousPlan === 'pro' || previousPlan === 'club') {
    await cancelPlan(String(user.userId));
  }

  captureServerEvent({
    distinctId: String(user.userId),
    event: 'subscription_ended',
    properties: {
      previous_plan: previousPlan,
      downgraded: previousPlan === 'pro' || previousPlan === 'club',
      cancellation_reason: subscription.cancellation_details?.reason ?? null,
    },
  });
}

// Echec d'un prelevement (souvent un renouvellement) : Stripe gere les relances,
// on garde l'acces pendant ce temps et on trace l'echec pour etre alerte.
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = customerIdOf(invoice.customer);
  const user = customerId ? await getUserByStripeCustomerId(customerId) : null;

  captureServerEvent({
    distinctId: user ? String(user.userId) : customerId ?? 'unknown_stripe_customer',
    event: 'subscription_payment_failed',
    properties: {
      plan: user?.plan ?? null,
      amount: invoice.amount_due,
      attempt_count: invoice.attempt_count,
      billing_reason: invoice.billing_reason,
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
    },
  });
}
