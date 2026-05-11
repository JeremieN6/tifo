const benefits = [
  {
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Rapide',
    desc: 'Votre affiche est prête en quelques secondes. Plus besoin d\'attendre des heures pour un visuel soigné.',
  },
  {
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /><path d="M3.05 11a9 9 0 0 1 17.9 0M3.05 13a9 9 0 0 0 17.9 0" />
      </svg>
    ),
    title: 'Adapté à l\'enjeu',
    desc: 'Derby local, finale de coupe, match de relégation... Tifo reconnaît l\'importance du match et adapte l\'ambiance visuelle.',
  },
  {
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <rect height="18" rx="2" width="18" x="3" y="3" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: 'Qualité professionnelle',
    desc: 'Des compositions pensées pour les réseaux sociaux. Percutant sur mobile, impactant sur desktop.',
  },
  {
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <rect height="20" rx="2" width="14" x="5" y="2" /><path d="M12 18h.01" />
      </svg>
    ),
    title: 'Multi-format réseaux',
    desc: 'Instagram carré, story verticale, bannière X/Twitter, vignette YouTube — une seule affiche, tous les formats.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="relative z-10 py-24 md:py-32">
      <div className="section-divider" />
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-green-600" />
            <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Pourquoi Tifo</span>
            <div className="h-px w-8 bg-green-600" />
          </div>
          <h2
            className="font-display uppercase text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.01em' }}
          >
            Tout ce dont vous avez besoin,<br />
            <span className="text-gradient-green">rien de superflu.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="card-hover flex flex-col gap-4 p-6"
              style={{
                background: 'rgba(5, 46, 22, 0.15)',
                border: '1px solid rgba(22, 163, 74, 0.12)',
                borderTop: '2px solid rgba(22, 163, 74, 0.4)',
              }}
            >
              <div className="text-green-500">{b.icon}</div>
              <div>
                <h3 className="font-body text-base font-black uppercase tracking-wider text-white">{b.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-slate-400">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="section-divider mt-24 md:mt-32" />
    </section>
  );
}
