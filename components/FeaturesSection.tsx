const features = [
  {
    tag: 'Clubs · Créateurs',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'Génération automatique',
    desc: 'Pour les clubs amateurs et créateurs de contenu, plus besoin de graphiste. Renseigne le match, Tifo fait le reste.',
  },
  {
    tag: 'Tous segments',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Intelligence contextuelle',
    desc: 'Derby local ou finale de Ligue des Champions : Tifo adapte le ton, la palette et la composition à l\'enjeu réel du match.',
  },
  {
    tag: 'Créateurs · Médias',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <rect height="20" rx="2" width="14" x="5" y="2" /><path d="M12 18h.01" />
      </svg>
    ),
    title: 'Formats réseaux sociaux',
    desc: 'Instagram 1:1 et 9:16, X/Twitter card, thumbnail YouTube, bannière Facebook — tous les formats en un clic.',
  },
  {
    tag: 'Clubs · Tous',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    title: 'Couleurs de club',
    desc: 'Personnalise chaque affiche avec les couleurs officielles de ton équipe. L\'identité de ton club, au cœur du visuel.',
  },
  {
    tag: 'Amateur → Pro',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Pour tous les niveaux',
    desc: 'Du club de district à la Ligue 2, du journaliste indépendant au streamer de 50k abonnés, Tifo s\'adapte à tout le monde.',
  },
  {
    tag: 'Tous segments',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
      </svg>
    ),
    title: 'Export instantané',
    desc: 'Téléchargement direct en haute résolution. Prêt à publier immédiatement sur tous tes réseaux sociaux.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative z-10 py-24 md:py-32" id="fonctionnalites">
      {/* Radial background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(5, 46, 22, 0.2) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16 flex flex-col items-start">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-green-600" />
            <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Fonctionnalités</span>
          </div>
          <h2
            className="font-display uppercase text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.01em' }}
          >
            Tout ce qu&apos;il faut pour<br />
            <span className="text-gradient-green">chaque match.</span>
          </h2>
          <p className="mt-4 max-w-lg font-body text-sm leading-relaxed text-slate-400">
            Conçu pour les clubs amateurs, créateurs de contenu, journalistes sportifs et streamers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-hover group flex flex-col gap-4 p-6"
              style={{ background: 'rgba(2, 15, 7, 0.8)', border: '1px solid rgba(22, 163, 74, 0.1)' }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center text-green-500 transition-colors duration-200 group-hover:text-green-400"
                  style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.2)' }}
                >
                  {f.icon}
                </div>
                <span
                  className="font-body text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'rgba(22, 163, 74, 0.6)', background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.15)', padding: '2px 8px' }}
                >
                  {f.tag}
                </span>
              </div>
              <div>
                <h3 className="font-body text-sm font-black uppercase tracking-wide text-white">{f.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-slate-500 transition-colors duration-200 group-hover:text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
