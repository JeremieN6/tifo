'use client';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 'Gratuit',
    description: 'Pour découvrir Tifo',
    features: ['5 affiches/mois', 'Tous les styles', 'Téléchargement inclus', 'Support communautaire'],
    cta: 'Commencer gratuitement',
    href: '/auth/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '9€',
    period: '/mois',
    description: 'Pour les créateurs actifs',
    features: ['Affiches illimitées', 'Formats HD', 'Image de référence', 'Support prioritaire'],
    cta: 'Passer au Pro',
    hrefEnv: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO',
    highlighted: true,
  },
  {
    name: 'Club',
    price: '29€',
    period: '/mois',
    description: 'Pour les clubs et équipes',
    features: ['Affiches illimitées', 'Accès prioritaire IA', 'Logo club auto', 'Support dédié'],
    cta: 'Passer au Club',
    hrefEnv: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CLUB',
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight text-white">Tarifs</h2>
          <p className="mt-4 text-gray-400">Simple, transparent, sans engagement.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const href = plan.href
              ? plan.href
              : plan.hrefEnv === 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO'
              ? (process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ?? '/auth/register')
              : (process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CLUB ?? '/auth/register');

            return (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-8 flex flex-col ${
                  plan.highlighted
                    ? 'border-green-500 bg-green-950/20'
                    : 'border-green-900/30 bg-green-950/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-black">
                      Populaire
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-display text-2xl uppercase text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-5xl text-white">{plan.price}</span>
                    {plan.period && <span className="text-gray-500">{plan.period}</span>}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <svg className="h-4 w-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <Link
                    href={href}
                    className={`block w-full rounded-md py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? 'bg-green-500 text-black hover:bg-green-400'
                        : 'border border-green-900/40 text-white hover:border-green-500/50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
