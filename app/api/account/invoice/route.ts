import { NextRequest, NextResponse } from 'next/server';
import { publicUrl } from '@/lib/app-url';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripeClient, resolveOrCreateStripeCustomer } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(publicUrl(req, '/auth/login'));
  }

  try {
    const stripe = getStripeClient();
    const { customerId } = await resolveOrCreateStripeCustomer(stripe, session.user.id);

    const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 });
    const latest = invoices.data.find((invoice) => invoice.status === 'paid') ?? invoices.data[0];

    const invoiceUrl = latest?.invoice_pdf ?? latest?.hosted_invoice_url;
    if (!invoiceUrl) {
      return NextResponse.redirect(publicUrl(req, '/account?invoice=not-found'), 303);
    }

    return NextResponse.redirect(invoiceUrl, 303);
  } catch (err) {
    console.error('[account/invoice]', err);
    return NextResponse.redirect(publicUrl(req, '/account?invoice=error'), 303);
  }
}
