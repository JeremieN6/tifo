'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative flex min-h-screen items-center justify-center px-6 pt-24 md:px-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Propulsé par GPT-image-1
        </div>

        <h1 className="font-display text-6xl uppercase leading-none tracking-tight text-white sm:text-7xl md:text-8xl">
          Des affiches de match{' '}
          <span className="text-green-500">qui claquent</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 md:text-xl">
          Génère des affiches professionnelles pour tes matchs en quelques clics.
          Idéal pour les clubs amateurs, les créateurs sportifs et les supporters passionnés.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={session ? '/create' : '/auth/register'}
            className="glow-pulse rounded-md bg-green-500 px-8 py-4 text-base font-semibold text-black hover:bg-green-400 transition-colors"
          >
            Créer ton affiche gratuitement
          </Link>
          <Link
            href="/#how-it-works"
            className="rounded-md border border-green-900/40 px-8 py-4 text-base text-gray-300 hover:border-green-500/50 hover:text-white transition-colors"
          >
            Voir comment ça marche
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-600">5 affiches gratuites · Aucune carte bancaire requise</p>
      </div>
    </section>
  );
}
