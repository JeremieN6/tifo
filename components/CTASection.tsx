'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function CTASection() {
  const { data: session } = useSession();

  return (
    <section className="bg-green-950/20 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-5xl uppercase tracking-tight text-white">
          Prêt à créer ta première affiche ?
        </h2>
        <p className="mt-4 text-gray-400">
          Rejoins des centaines de clubs et créateurs qui font confiance à Tifo.
        </p>
        <div className="mt-10">
          <Link
            href={session ? '/create' : '/auth/register'}
            className="glow-pulse rounded-md bg-green-500 px-10 py-4 text-base font-semibold text-black hover:bg-green-400 transition-colors"
          >
            {session ? 'Créer une affiche' : 'Commencer gratuitement'}
          </Link>
        </div>
      </div>
    </section>
  );
}
