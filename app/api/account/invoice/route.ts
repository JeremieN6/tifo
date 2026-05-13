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

    const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 });
    const latest = invoices.data.find((invoice) => invoice.status === 'paid') ?? invoices.data[0];

    const invoiceUrl = latest?.invoice_pdf ?? latest?.hosted_invoice_url;
    if (!invoiceUrl) {
      return NextResponse.redirect(new URL('/account?invoice=not-found', req.url), 303);
    }

    return NextResponse.redirect(invoiceUrl, 303);
  } catch (err) {
    console.error('[account/invoice]', err);
    return NextResponse.redirect(new URL('/account?invoice=error', req.url), 303);
  }
}
