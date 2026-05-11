import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative z-10 overflow-hidden py-32 md:py-48">
      {/* Radial gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(5, 46, 22, 0.6) 0%, transparent 70%)' }}
      />
      {/* Grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(22, 163, 74, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(22, 163, 74, 1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Blur blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'rgba(22, 163, 74, 0.12)', filter: 'blur(80px)' }}
      />
      {/* GO watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display uppercase text-white"
        style={{ fontSize: 'clamp(8rem, 30vw, 22rem)', opacity: 0.02, letterSpacing: '-0.05em', lineHeight: 1 }}
      >
        GO
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-green-600" />
          <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Prêt ?</span>
          <div className="h-px w-8 bg-green-600" />
        </div>

        <h2
          className="font-display uppercase text-white"
          style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '-0.01em', lineHeight: 1.1 }}
        >
          Prêt à donner à chaque match{' '}
          <span className="text-gradient-green">la mise en scène qu&apos;il mérite&nbsp;?</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-slate-400">
          Rejoignez les premiers clubs, médias et créateurs à communiquer avec des visuels qui font la différence — en quelques secondes, avant chaque match.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="group relative overflow-hidden bg-green-700 px-8 py-4 font-body text-sm font-black uppercase tracking-[0.25em] text-white transition-all duration-300 hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            <span className="relative z-10">Créer une affiche maintenant</span>
          </Link>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 font-body text-xs text-slate-500">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green-600" />
          Starter gratuit • Pro et Club en prix de lancement
        </p>
      </div>
    </section>
  );
}
