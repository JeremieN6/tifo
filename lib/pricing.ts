export const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    quota: 5,
    label: 'Gratuit',
    features: ['5 affiches/mois', 'Formats standard', 'Support communautaire'],
  },
  pro: {
    name: 'Pro',
    price: 9,
    quota: 999999,
    label: '9€/mois',
    features: ['Affiches illimitées', 'Formats HD', 'Support prioritaire'],
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ?? '#',
  },
  club: {
    name: 'Club',
    price: 29,
    quota: 999999,
    label: '29€/mois',
    features: ['Affiches illimitées', 'Accès prioritaire IA', 'Support dédié', 'Logo club auto'],
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CLUB ?? '#',
  },
} as const;

export type PlanKey = keyof typeof PLANS;
