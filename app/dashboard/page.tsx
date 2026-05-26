'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Quota {
  plan: string;
  quota_remaining: number;
  quota_total: number;
  trial_ends_at?: string | null;
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

  const isUnlimited = quota?.quota_total === 999999;
  const dashboardPlan = quota?.plan ?? 'starter';
  const isClubPlan = dashboardPlan === 'club';
  const trialEndsAt = quota?.trial_ends_at ? new Date(quota.trial_ends_at) : null;
  const trialEndsAtLabel = trialEndsAt
    ? trialEndsAt.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const nextUpgrade = dashboardPlan === 'starter'
    ? {
        target: 'Pro',
        href: '/api/stripe/checkout?plan=pro',
        cta: 'Upgrade vers Pro',
        description: 'Passez en Pro pour publier sans limite et exporter vos visuels en haute définition.',
        features: ['Affiches illimitées', 'Tous les formats réseaux', 'Sans filigrane', 'Export PNG + JPG HD'],
      }
    : dashboardPlan === 'pro'
      ? {
          target: 'Club',
          href: '/api/stripe/checkout?plan=club',
          cta: 'Passer au Club',
          description: 'Passez en Club pour gérer plusieurs équipes et aller plus loin dans la personnalisation.',
          features: ['Tout ce qu\'il y a dans Pro', 'Multi-équipes', 'Palette personnalisée', 'Formats sur mesure'],
        }
      : null;

  return (
    <div className="min-h-screen bg-[#020f07]">
      <div className="stadium-glow pointer-events-none fixed inset-0 z-0"></div>
      <div className="specific-background pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.14),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.06),transparent_20%)]" />
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-12">

        {/* Hero card */}
        <div className="mb-8 p-8 md:p-10" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_300px]">

            {/* Left col */}
            <div>
              <div className="badge-beta mb-5 rounded-lg inline-flex items-center gap-2 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-[0.2em]">
                Dashboard utilisateur
              </div>
              <h1
                className="font-display uppercase leading-[0.9] text-white"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-0.02em' }}
              >
                Vos affiches,<br />
                <span className="text-gradient-green">prêts à jouer</span>
              </h1>
              <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-slate-400">
                Suivez vos créations récentes, votre quota actif et votre plan Tifo sans quitter le terrain.
              </p>

              {/* 3 stat cards */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

                {/* Plan actuel */}
                <div className="p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.15)' }}>
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Plan actuel</p>
                  <p className="mt-1 font-display text-2xl uppercase text-white">
                    {quota?.plan === 'starter' ? 'Gratuit' : (quota?.plan ?? '—')}
                  </p>
                  <div className="badge-beta mt-2 inline-block px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wider">
                    {dashboardPlan === 'starter' ? 'Accès bêta' : 'Abonnement actif'}
                  </div>
                  <p className="mt-3 font-body text-xs leading-relaxed text-slate-500">
                    {dashboardPlan === 'starter'
                      ? 'Pour lancer vos premiers visuels et tester la création d\'affiches avec Tifo.'
                      : dashboardPlan === 'pro'
                        ? 'Votre plan Pro est actif. Débloquez Club pour gérer plusieurs équipes.'
                        : trialEndsAtLabel
                          ? `Essai Club actif jusqu'au ${trialEndsAtLabel}.`
                          : 'Merci, votre plan Club est actif. Vous avez accès à l\'expérience complète.'}
                  </p>
                  {nextUpgrade ? (
                    <Link
                      href={nextUpgrade.href}
                      className="mt-4 block w-full bg-green-700 px-3 py-2 text-center font-body text-xs font-black uppercase tracking-[0.15em] text-white hover:bg-green-600 transition-colors"
                    >
                      {nextUpgrade.cta}
                    </Link>
                  ) : (
                    <p className="mt-4 text-center font-body text-xs font-semibold uppercase tracking-[0.12em] text-green-500">
                      Merci pour votre confiance
                    </p>
                  )}
                </div>

                {/* Quota */}
                <div className="p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.15)' }}>
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Quota de mois-ci</p>
                  <p className="mt-1 font-display text-5xl text-white">
                    {isUnlimited ? '∞' : (quota?.quota_remaining ?? '—')}
                  </p>
                  <p className="font-body text-xs text-slate-500">
                    {isUnlimited ? 'illimitées' : `restantes sur ${quota?.quota_total ?? 5}`}
                  </p>
                  <p className="mt-3 font-body text-xs text-slate-500">
                    {quota && !isUnlimited ? `${quota.quota_total - quota.quota_remaining}/${quota.quota_total} utilisées` : ''}
                  </p>
                </div>

                {/* Activité */}
                <div className="p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.15)' }}>
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Activité récente</p>
                  <p className="mt-1 font-display text-5xl text-white">{posters.length}</p>
                  <p className="font-body text-xs text-slate-500">
                    affiche{posters.length !== 1 ? 's' : ''} récente{posters.length !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between border border-green-900/30 bg-green-950/20 px-2.5 py-2">
                      <p className="font-body text-[10px] uppercase tracking-[0.14em] text-slate-500">Générées ce mois</p>
                      <p className="font-display text-lg text-white">{posters.length}</p>
                    </div>
                    <div className="flex items-center justify-between border border-green-900/30 bg-green-950/20 px-2.5 py-2">
                      <p className="font-body text-[10px] uppercase tracking-[0.14em] text-slate-500">Dernière visite</p>
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-white">
                        {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="flex flex-col gap-4">
              {/* Connected as */}
              <div className="p-5" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.15)' }}>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Connecté en tant que</p>
                <p className="mt-2 break-all font-body text-sm font-semibold text-white">{session?.user?.email}</p>
                <p className="font-body text-xs text-slate-500">
                  {trialEndsAtLabel
                    ? `Essai offert jusqu'au ${trialEndsAtLabel}`
                    : `Période active : ${new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`}
                </p>
              </div>

              {/* Upgrade panel */}
              {nextUpgrade && (
                <div className="flex-1 p-5" style={{ background: 'rgba(5,46,22,0.25)', border: '1px solid rgba(22,163,74,0.3)' }}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Upgrade conseillé</p>
                      <p className="font-display text-3xl uppercase text-white">{nextUpgrade.target}</p>
                    </div>
                    <div className="badge-beta rounded-lg px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wider">Plan supérieur</div>
                  </div>
                  <p className="font-body text-xs text-slate-400">
                    {nextUpgrade.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {nextUpgrade.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 p-2.5 relative border border-green-900/40"
                        style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)' }}
                      >
                        <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 16 16">
                          <path d="M13 4L6 11L3 8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-body text-xs text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={nextUpgrade.href}
                    className="mt-5 block w-full bg-green-700 py-2.5 text-center font-body text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-green-600 transition-colors"
                  >
                    {nextUpgrade.cta}
                  </Link>
                </div>
              )}

              {isClubPlan && (
                <div className="flex-1 p-5" style={{ background: 'rgba(5,46,22,0.25)', border: '1px solid rgba(22,163,74,0.3)' }}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Plan premium actif</p>
                      <p className="font-display text-3xl uppercase text-white">Club</p>
                    </div>
                    <div className="badge-beta rounded-lg px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wider">Merci</div>
                  </div>
                  <p className="font-body text-xs leading-relaxed text-slate-400">
                    Merci pour votre confiance. Votre accès Club est actif avec toutes les fonctionnalités avancées.
                  </p>
                  <p className="mt-5 text-center font-body text-xs font-black uppercase tracking-[0.18em] text-green-500">
                    On est ravis de vous compter parmi les clubs partenaires
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-px w-6 bg-green-600" />
                <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Historique</p>
              </div>
              <h2 className="font-display text-2xl uppercase text-white">Affiches générées</h2>
            </div>
            <Link
              href="/create"
              className="px-4 py-2.5 font-body text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-green-900/20"
              style={{ border: '1px solid rgba(22,163,74,0.3)' }}
            >
              Générer un nouveau visuel
            </Link>
          </div>

          {loading ? (
            <div
              className="p-12 text-center font-body text-sm text-slate-500"
              style={{ background: 'rgba(5,46,22,0.1)', border: '1px solid rgba(22,163,74,0.1)' }}
            >
              Chargement…
            </div>
          ) : posters.length === 0 ? (
            <div
              className="flex flex-col items-center py-16"
              style={{ background: 'rgba(5,46,22,0.1)', border: '1px solid rgba(22,163,74,0.1)' }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center"
                style={{ border: '2px solid rgba(22,163,74,0.4)', background: 'rgba(22,163,74,0.1)' }}
              >
                <span className="font-display text-2xl text-green-500">0</span>
              </div>
              <p className="mt-4 font-display text-xl uppercase text-white">Aucune affiche générée</p>
              <p className="mt-2 font-body text-sm text-slate-400">
                Votre historique apparaîtra ici avec miniature et date dès votre première génération.
              </p>
              <Link
                href="/create"
                className="mt-6 bg-green-700 px-6 py-2.5 font-body text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-green-600 transition-colors"
              >
                Créer ma première affiche
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posters.map((poster) => (
                <div
                  key={poster.id}
                  className="card-hover transition-all duration-300"
                  style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.12)' }}
                >
                  {(poster.image_url ?? poster.image_data) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(poster.image_url ?? poster.image_data) as string}
                      alt="Affiche"
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="flex w-full aspect-[2/3] items-center justify-center font-body text-sm text-slate-600">
                      Image indisponible
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate font-body text-xs text-slate-400">
                      {poster.settings?.homeTeam && poster.settings?.awayTeam
                        ? `${poster.settings.homeTeam} vs ${poster.settings.awayTeam}`
                        : 'Affiche sans titre'}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-slate-600">
                      {new Date(poster.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {(poster.image_url ?? poster.image_data) && (
                      <button
                        onClick={() => downloadPoster(poster)}
                        className="mt-2 w-full py-1.5 font-body text-xs text-slate-400 hover:text-white transition-colors"
                        style={{ border: '1px solid rgba(22,163,74,0.2)' }}
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