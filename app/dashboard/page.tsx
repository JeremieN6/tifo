'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Quota {
  plan: string;
  quota_remaining: number;
  quota_total: number;
}

interface Poster {
  id: number;
  prompt: string | null;
  image_url?: string | null;
  image_data?: string | null;
  settings: { homeTeam?: string; awayTeam?: string; date?: string } | null;
  created_at: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [qRes, pRes] = await Promise.all([
        fetch('/api/generation-quota'),
        fetch('/api/poster-history'),
      ]);
      if (qRes.ok) setQuota(await qRes.json());
      if (pRes.ok) setPosters(await pRes.json());
      setLoading(false);
    }
    load();
  }, []);

  function downloadPoster(poster: Poster) {
    const imageUrl = poster.image_url ?? poster.image_data;
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `tifo-affiche-${poster.id}.png`;
    a.click();
  }

  const planLabel: Record<string, string> = {
    starter: 'Starter (Gratuit)',
    pro: 'Pro',
    club: 'Club',
  };

  const isUnlimited = quota?.quota_total === 999999;

  return (
    <div className="min-h-screen bg-[#020f07]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-12">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-4xl uppercase text-white">Tableau de bord</h1>
            <p className="text-gray-400 mt-1">Bienvenue, {session?.user?.name ?? session?.user?.email}</p>
          </div>
          <Link
            href="/create"
            className="rounded-md bg-green-500 px-6 py-3 text-sm font-semibold text-black hover:bg-green-400 transition-colors text-center"
          >
            + Créer une affiche
          </Link>
        </div>

        {/* Quota card */}
        {quota && (
          <div className="mb-10 rounded-xl border border-green-900/30 bg-green-950/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">Plan actuel</p>
                <p className="text-xl font-semibold text-white capitalize">{planLabel[quota.plan] ?? quota.plan}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Affiches restantes ce mois</p>
                <p className="text-3xl font-display text-green-400">
                  {isUnlimited ? '∞' : `${quota.quota_remaining} / ${quota.quota_total}`}
                </p>
              </div>
              {!isUnlimited && (
                <div className="sm:text-right">
                  <Link href="/#pricing" className="rounded-md border border-green-500/40 px-4 py-2 text-sm text-green-400 hover:bg-green-900/20 transition-colors">
                    Passer au Pro →
                  </Link>
                </div>
              )}
            </div>

            {!isUnlimited && quota.quota_total > 0 && (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-green-950">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${(quota.quota_remaining / quota.quota_total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Poster history */}
        <div>
          <h2 className="font-display text-2xl uppercase text-white mb-6">Mes affiches</h2>

          {loading ? (
            <div className="text-gray-500 text-center py-12">Chargement…</div>
          ) : posters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-green-900/30 py-16 text-center">
              <p className="text-gray-500">Tu n'as pas encore créé d'affiche.</p>
              <Link href="/create" className="mt-4 inline-block text-green-400 hover:text-green-300 text-sm">
                Créer ta première affiche →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posters.map((poster) => (
                <div key={poster.id} className="group relative rounded-xl border border-green-900/20 bg-green-950/10 overflow-hidden hover:border-green-500/30 transition-colors">
                  {(poster.image_url ?? poster.image_data) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(poster.image_url ?? poster.image_data) as string}
                      alt="Affiche"
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-green-950/20 flex items-center justify-center text-gray-600 text-sm">
                      Image indisponible
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 truncate">
                      {poster.settings?.homeTeam && poster.settings?.awayTeam
                        ? `${poster.settings.homeTeam} vs ${poster.settings.awayTeam}`
                        : 'Affiche sans titre'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(poster.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {(poster.image_url ?? poster.image_data) && (
                      <button
                        onClick={() => downloadPoster(poster)}
                        className="mt-2 w-full rounded border border-green-900/40 py-1.5 text-xs text-gray-400 hover:border-green-500/40 hover:text-white transition-colors"
                      >
                        Télécharger
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
