import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession, getStripeClient, resolveOrCreateStripeCustomer, type PaidPlan } from '@/lib/stripe';
import { captureServerEvent } from '@/lib/posthog-server';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const rawPlan = req.nextUrl.searchParams.get('plan');
  if (rawPlan !== 'pro' && rawPlan !== 'club') {
    return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const { customerId } = await resolveOrCreateStripeCustomer(stripe, session.user.id);
    const checkoutSession = await createCheckoutSession(
      stripe,
      customerId,
      rawPlan as PaidPlan,
      req.nextUrl.origin,
      session.user.id
    );

    captureServerEvent({
      distinctId: session.user.id,
      event: 'checkout_started',
      properties: {
        plan: rawPlan,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'URL de paiement indisponible.' }, { status: 500 });
    }

    return NextResponse.redirect(checkoutSession.url, 303);
  } catch (err) {
    captureServerEvent({
      distinctId: session.user.id,
      event: 'checkout_failed',
      properties: {
        plan: rawPlan,
        reason: 'server_error',
      },
    });
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: 'Impossible de démarrer le paiement.' }, { status: 500 });
  }
}
