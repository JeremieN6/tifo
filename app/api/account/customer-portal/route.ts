import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripeClient, resolveOrCreateStripeCustomer } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  try {
    const stripe = getStripeClient();
    const { customerId } = await resolveOrCreateStripeCustomer(stripe, session.user.id);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/account`,
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (err) {
    console.error('[account/customer-portal]', err);
    return NextResponse.redirect(new URL('/account?portal=error', req.url), 303);
  }
}
