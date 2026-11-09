import Stripe from 'stripe';
import {
  getStripeCustomerIdByUserId,
  getUserEmail,
  setStripeCustomerId,
} from './billing';

export type PaidPlan = 'pro' | 'club';

const PLAN_CONFIG: Record<PaidPlan, { amount: number; name: string }> = {
  pro: {
    amount: 900,
    name: 'Tifo Pro',
  },
  club: {
    amount: 2900,
    name: 'Tifo Club',
  },
};

export function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY manquant.');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
}

async function customerExistsInStripe(stripe: Stripe, customerId: string): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !('deleted' in customer && customer.deleted);
  } catch (err) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
      console.warn('[stripe] client enregistre introuvable chez Stripe, il sera recree:', customerId);
      return false;
    }
    throw err;
  }
}

export async function resolveOrCreateStripeCustomer(
  stripe: Stripe,
  userId: string
): Promise<{ customerId: string; email: string }> {
  const email = await getUserEmail(userId);
  if (!email) {
    throw new Error('Utilisateur introuvable.');
  }

  const storedCustomerId = await getStripeCustomerIdByUserId(userId);
  if (storedCustomerId && (await customerExistsInStripe(stripe, storedCustomerId))) {
    return { customerId: storedCustomerId, email };
  }
  // Sinon : identifiant absent, ou issu d'un autre mode Stripe (ex: client cree en mode test
  // puis cle de production) -> on retrouve ou on recree le client et on met la base a jour.

  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  if (existingCustomers.data.length > 0) {
    const customerId = existingCustomers.data[0].id;
    await setStripeCustomerId(email, customerId);
    return { customerId, email };
  }

  const createdCustomer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await setStripeCustomerId(email, createdCustomer.id);
  return { customerId: createdCustomer.id, email };
}

export async function createCheckoutSession(
  stripe: Stripe,
  customerId: string,
  plan: PaidPlan,
  origin: string,
  userId: string
) {
  const config = PLAN_CONFIG[plan];

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: config.amount,
          recurring: { interval: 'month' },
          product_data: {
            name: config.name,
          },
        },
      },
    ],
    success_url: `${origin}/checkout/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account?checkout=cancelled`,
    metadata: {
      plan,
      userId,
    },
    allow_promotion_codes: true,
  });
}
