const steps = [
  {
    number: '01',
    icon: (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    title: 'Renseigne le match',
    desc: 'Équipes, compétition, date et enjeu. Tifo comprend automatiquement le contexte, derby, finale, match décisif. Que tu joues en district ou en Nationale 3, Tifo s\'adapte.',
    note: 'Clubs amateurs, médias, créateurs : tout le monde peut le faire.',
    bg: 'rgba(5, 46, 22, 0.1)',
    numberColor: 'rgba(22, 163, 74, 0.07)',
  },
  {
    number: '02',
    icon: (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'Tifo génère l\'affiche',
    desc: 'En quelques secondes, Tifo choisit l\'ambiance, la composition et le style adaptés à l\'importance du match.',
    note: 'Finale ? Ambiance épique. Derby ? Tension maximale. Chaque match a sa mise en scène.',
    bg: 'rgba(5, 46, 22, 0.2)',
    numberColor: 'rgba(22, 163, 74, 0.12)',
  },
  {
    number: '03',
    icon: (
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
    ),
    title: 'Télécharge et publie',
    desc: 'Récupère ton affiche dans les formats adaptés à chaque réseau. Prête à être publiée, immédiatement.',
    note: 'Instagram, X/Twitter, TikTok, YouTube — tout y est.',
    bg: 'rgba(5, 46, 22, 0.1)',
    numberColor: 'rgba(22, 163, 74, 0.07)',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative z-10 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-green-600" />
            <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Comment ça marche</span>
            <div className="h-px w-8 bg-green-600" />
          </div>
          <h2
            className="font-display uppercase text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.01em' }}
          >
            3 étapes.{' '}
            <span className="text-gradient-green">C&apos;est tout.</span>
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Connecting line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-10 hidden h-px md:block"
            style={{ background: 'linear-gradient(to right, transparent 0%, rgba(22, 163, 74, 0.3) 10%, rgba(22, 163, 74, 0.3) 90%, transparent 100%)' }}
          />

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col items-start gap-5 p-8"
              style={{ background: step.bg, border: '1px solid rgba(22, 163, 74, 0.12)' }}
            >
              <div
                aria-hidden="true"
                className="step-number pointer-events-none absolute right-4 top-2 select-none text-[5rem] leading-none"
                style={{ color: step.numberColor }}
              >
                {step.number}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center"
                  style={{ background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.3)' }}
                >
                  <div className="text-green-400">{step.icon}</div>
                </div>
                <span className="font-display text-lg tracking-widest text-green-700">ÉTAPE {step.number}</span>
              </div>
              <div>
                <h3
                  className="font-display uppercase text-white"
                  style={{ fontSize: '1.5rem', letterSpacing: '-0.01em' }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-slate-400">{step.desc}</p>
                <p className="mt-3 font-body text-xs font-semibold italic text-green-700/80">{step.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
