'use client';
import Link from 'next/link';

const proPaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ?? '/#pricing';
const clubPaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CLUB ?? '/#pricing';

const checkIcon = (
  <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 16 16">
    <path d="M13 4L6 11L3 8" />
  </svg>
);

const crossIcon = (
  <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 16 16">
    <path d="M12 4L4 12M4 4l8 8" />
  </svg>
);

const plans = [
  {
    name: 'Starter',
    price: '0€',
    label: 'Offert au lancement pour les 200 premiers comptes',
    description: 'Pour tester Tifo, publier vos premiers visuels et lancer votre processus de création.',
    features: [
      { text: '5 affiches / mois', included: true },
      { text: 'Formats standard (1:1, 16:9)', included: true },
      { text: 'Tous types de match', included: true },
      { text: 'Filigrane Tifo', included: true },
      { text: 'Export JPG', included: true },
      { text: 'Format story verticale', included: false },
      { text: 'Sans filigrane', included: false },
      { text: 'Support prioritaire', included: false },
    ],
    cta: 'Créer un compte',
    href: '/auth/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '9€',
    label: 'Prix de lancement — 100 premiers clients',
    description: 'Pour les créateurs et journalistes qui publient régulièrement.',
    features: [
      { text: 'Affiches illimitées', included: true },
      { text: 'Tous les formats réseaux', included: true },
      { text: 'Sans filigrane', included: true },
      { text: 'Export PNG + JPG HD', included: true },
      { text: 'Personnalisation avancée', included: true },
      { text: 'Support email prioritaire', included: true },
      { text: 'Multi-équipes', included: false },
      { text: 'Export personnalisé', included: false },
    ],
    cta: 'Choisir Pro',
    href: proPaymentLink,
    highlighted: true,
  },
  {
    name: 'Club',
    price: '29€',
    label: 'Prix de lancement — 50 premiers clubs',
    description: 'Pour les clubs, médias régionaux et agences avec plusieurs équipes.',
    features: [
      { text: 'Tout ce qu\'il y a dans Pro', included: true },
      { text: 'Multi-équipes / Multi-compétitions', included: true },
      { text: 'Palette couleur personnalisée', included: true },
      { text: 'Export formats custom', included: true },
      { text: 'Intégration flux RSS/API', included: true },
      { text: 'Support dédié', included: true },
    ],
    cta: 'Choisir Club',
    href: clubPaymentLink,
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section className="relative z-10 py-24 md:py-32" id="pricing">
      <div className="section-divider" />
      <div className="mx-auto max-w-7xl px-6 pt-24 md:px-12 md:pt-32">

        {/* Launch banner */}
        <div
          className="mb-12 flex items-center justify-center gap-3 p-4"
          style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}
        >
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-500 cta-pulse" />
          <p className="font-body text-sm font-semibold text-green-400">
            <span className="font-black text-white">Tarifs de lancement en vigueur.</span>{' '}
            Les offres payantes sont réservées aux premiers clients et sont accessibles via un paiement sécurisé.
          </p>
        </div>

        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-green-600" />
            <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Tarifs</span>
            <div className="h-px w-8 bg-green-600" />
          </div>
          <h2
            className="font-display uppercase text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.01em' }}
          >
            Simple, transparent,{' '}
            <span className="text-gradient-green">dès le lancement.</span>
          </h2>
          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-slate-400">
            Le plan Starter reste gratuit pour lancer vos premiers visuels. Les plans Pro et Club affichent des{' '}
            <strong className="text-slate-300">prix fondateurs</strong> réservés aux premiers clients.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 transition-all duration-300 ${plan.highlighted ? 'pricing-highlight' : 'card-hover'}`}
              style={
                plan.highlighted
                  ? { background: 'rgba(5, 46, 22, 0.4)', border: '1px solid rgba(22, 163, 74, 0.4)' }
                  : { background: 'rgba(5, 46, 22, 0.15)', border: '1px solid rgba(22, 163, 74, 0.12)' }
              }
            >
              {plan.highlighted && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 font-body text-xs font-black uppercase tracking-[0.2em] text-white"
                  style={{ background: '#16a34a' }}
                >
                  Populaire
                </div>
              )}

              <h3 className="font-display text-2xl uppercase tracking-widest text-white">{plan.name}</h3>

              <div className="mt-4">
                <div className="flex items-end gap-2">
                  <span className="font-display text-4xl text-white" style={{ letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span className="mb-1 font-body text-sm text-slate-500">/ mois</span>
                </div>
                <div
                  className="mt-2 inline-block px-2 py-1 font-body text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.25)', color: 'rgba(22, 163, 74, 0.9)' }}
                >
                  {plan.label}
                </div>
              </div>

              <p className="mt-4 font-body text-sm leading-relaxed text-slate-400">{plan.description}</p>

              <div className="my-6 h-px bg-green-900/20" />

              <ul className="flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f.text} className={`flex items-start gap-2.5 ${!f.included ? 'opacity-40' : ''}`}>
                    {f.included ? checkIcon : crossIcon}
                    <span className={`font-body text-sm ${f.included ? 'text-slate-300' : 'text-slate-500'}`}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href={plan.href}
                  className={`group relative flex w-full items-center justify-center overflow-hidden px-6 py-3.5 font-body text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                    plan.highlighted
                      ? 'bg-green-700 text-white hover:bg-green-600 cta-pulse'
                      : 'bg-transparent text-green-500 hover:bg-green-900/20'
                  }`}
                  style={!plan.highlighted ? { border: '1px solid rgba(22, 163, 74, 0.3)' } : undefined}
                >
                  {plan.highlighted && (
                    <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  )}
                  <span className="relative z-10">{plan.cta}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center font-body text-xs uppercase tracking-[0.18em] text-slate-500">
          L'offres PRO contient les fonctionnalités du plan STARTER, et l'offre CLUB contient celles de PRO. <br /> Pas de surprise, juste plus de possibilités à mesure que vous montez en gamme.
        </p>
      </div>
      <div className="section-divider mt-24 md:mt-32" />
    </section>
  );
}
