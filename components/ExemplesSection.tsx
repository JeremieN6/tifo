import Image from 'next/image';
import Link from 'next/link';

const posters = [
  {
    src: '/examples/alvarez-barca.jpg',
    alt: 'Affiche transfert Julián Álvarez - FC Barcelona',
    title: 'Julián Álvarez · FC Barcelona',
    badge: 'Recrutement',
    badgeStyle: {
      background: 'rgba(163, 0, 0, 0.2)',
      border: '1px solid rgba(163, 77, 77, 0.3)',
      color: 'rgb(252, 165, 165)',
    },
    rotate: '-4deg',
    glowColor: 'rgba(163, 0, 0, 0.3)',
  },
  {
    src: '/examples/mbappe-alnassr.jpg',
    alt: 'Affiche transfert Kylian Mbappé - Al Nassr',
    title: 'Kylian Mbappé · Al Nassr',
    badge: 'Transfert',
    badgeStyle: {
      background: 'rgba(202, 138, 4, 0.2)',
      border: '1px solid rgba(253, 224, 71, 0.3)',
      color: 'rgb(253, 230, 138)',
    },
    rotate: '0deg',
    glowColor: 'rgba(202, 138, 4, 0.3)',
  },
  {
    src: '/examples/vitinha-realmadrid.jpg',
    alt: 'Affiche transfert Vitinha - Real Madrid',
    title: 'Vitinha · Real Madrid',
    badge: 'Recrutement',
    badgeStyle: {
      background: 'rgba(200, 170, 90, 0.2)',
      border: '1px solid rgba(212, 182, 112, 0.3)',
      color: 'rgb(253, 230, 138)',
    },
    rotate: '5.5deg',
    glowColor: 'rgba(200, 170, 90, 0.3)',
  },
];

export default function ExemplesSection() {
  return (
    <section id="exemples" className="relative z-10 py-20 md:py-28">
      <div className="section-divider" />
      <div className="mx-auto max-w-7xl px-6 pt-20 md:px-12 md:pt-28">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-green-600" />
            <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">
              Exemples de visuels générés
            </span>
            <div className="h-px w-8 bg-green-600" />
          </div>
          <h2
            className="font-display uppercase text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.01em' }}
          >
            Résultats{' '}
            <span className="text-gradient-green">réels.</span>
          </h2>
          <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-slate-400">
            Ces affiches ont été générées par Tifo en quelques secondes.{' '}
            <span className="text-slate-200">Aucun design, aucune compétence requise.</span>
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-3 md:gap-8 lg:gap-12">
          {posters.map((poster) => (
            <div key={poster.src} className="flex flex-col items-center gap-4">
              {/* Card */}
              <div
                className="relative mx-auto w-full max-w-[280px] transition-transform duration-500 hover:scale-[1.03]"
                style={{ transform: `rotate(${poster.rotate})`, transformOrigin: 'center bottom' }}
              >
                {/* Image container */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    aspectRatio: '4 / 5',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    boxShadow: 'rgba(0,0,0,0.6) 0px 20px 60px, rgba(0,0,0,0.3) 0px 0px 40px inset',
                  }}
                >
                  <Image
                    src={poster.src}
                    alt={poster.alt}
                    fill
                    sizes="280px"
                    className="object-cover"
                    priority={poster.rotate === '-4deg'}
                  />
                </div>

                {/* Glow */}
                <div
                  className="pointer-events-none absolute -bottom-4 left-1/2 h-6 w-4/5 -translate-x-1/2 blur-xl"
                  style={{ background: poster.glowColor }}
                />
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="font-display text-sm uppercase tracking-wider text-white/70">
                  {poster.title}
                </div>
                <div
                  className="inline-block px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={poster.badgeStyle}
                >
                  {poster.badge}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <Link
            href="/create"
            className="group relative overflow-hidden bg-green-700 px-10 py-4 font-body text-sm font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 cta-pulse"
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
              aria-hidden="true"
            />
            <span className="relative z-10 flex items-center gap-3">
              Créer ton affiche gratuitement
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </span>
          </Link>
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-slate-600">
            Aucune carte bancaire requise · Gratuit pour commencer
          </p>
        </div>
      </div>

      <div className="section-divider mt-20 md:mt-28" />
    </section>
  );
}
