'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Quota {
  plan: string;
  quota_remaining: number;
  quota_total: number;
}

interface PaymentEvent {
  event_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function AccountPage() {
  const { data: session } = useSession();
  const [quota, setQuota] = useState<Quota | null>(null);
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Cancel
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function load() {
      const [qRes, pRes] = await Promise.all([
        fetch('/api/generation-quota'),
        fetch('/api/account/billing'),
      ]);
      if (qRes.ok) setQuota(await qRes.json());
      if (pRes.ok) setPayments(await pRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');

    if (newPwd !== confirmPwd) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPwdLoading(true);
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    const data = await res.json();
    setPwdLoading(false);

    if (!res.ok) {
      setPwdError(data.error ?? 'Erreur.');
    } else {
      setPwdMsg('Mot de passe mis à jour.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    }
  }

  async function handleCancel() {
    if (!confirm('Confirmes-tu l\'annulation de ton abonnement ? Tu repasseras sur le plan Starter.')) return;
    setCancelling(true);
    await fetch('/api/account/subscription', { method: 'POST' });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#020f07]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28 md:px-12">

        {/* Hero card */}
        <div className="mb-8 p-8 md:p-10" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_200px_200px]">

            {/* Title */}
            <div>
              <div className="badge-beta mb-4 inline-flex items-center gap-2 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-[0.2em]">
                Compte &amp; Facturation
              </div>
              <h1
                className="font-display uppercase leading-[0.9] text-white"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-0.02em' }}
              >
                Pilotez<br />
                <span className="text-gradient-green">votre accès</span>
              </h1>
              <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-slate-400">
                Retrouvez vos informations, mettez à jour votre mot de passe, consultez vos achats et adaptez votre formule.
              </p>
            </div>

            {/* Plan stat */}
            <div className="p-5" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.15)' }}>
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Plan actuel</p>
              <p className="mt-1 font-display text-3xl uppercase text-white">{quota?.plan?.toUpperCase() ?? '—'}</p>
              {quota && (
                <div
                  className="mt-1 inline-block px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a' }}
                >
                  {quota.quota_remaining} restants
                </div>
              )}
              <p className="mt-2 font-body text-xs text-slate-500">
                Période active : {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Payments stat */}
            <div className="p-5" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.15)' }}>
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Paiements</p>
              <p className="mt-1 font-display text-3xl text-white">{payments.length}</p>
              <p className="font-body text-xs text-slate-500">
                transaction{payments.length !== 1 ? 's' : ''} enregistrée{payments.length !== 1 ? 's' : ''}
              </p>
              <p className="mt-2 font-body text-xs text-slate-500">
                Total : {(payments.reduce((acc, p) => acc + p.amount, 0) / 100).toFixed(2)}€
              </p>
            </div>
          </div>
        </div>

        {/* Main 2-col */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Left — Identity */}
          <div className="p-6" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Informations personnelles</p>
                <h2 className="font-display text-2xl uppercase text-white">Identité</h2>
              </div>
              <span
                className="px-2 py-1 font-body text-[9px] font-bold uppercase tracking-wider"
                style={{ border: '1px solid rgba(22,163,74,0.3)', color: 'rgba(22,163,74,0.9)' }}
              >
                Sécurisé
              </span>
            </div>

            <div className="mb-6 p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.12)' }}>
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Email du compte</p>
              <p className="font-body text-sm font-semibold text-white break-all">{session?.user?.email}</p>
              <p className="mt-1 font-body text-xs text-slate-500">
                Cette adresse est utilisée pour retrouver vos achats et l&apos;historique associé à votre compte.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Changer le mot de passe</p>
              <div>
                <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                  className="w-full bg-[#020f07] px-4 py-2.5 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                  style={{ border: '1px solid rgba(22,163,74,0.2)' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 caractères"
                  className="w-full bg-[#020f07] px-4 py-2.5 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                  style={{ border: '1px solid rgba(22,163,74,0.2)' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Confirmation</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                  className="w-full bg-[#020f07] px-4 py-2.5 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                  style={{ border: '1px solid rgba(22,163,74,0.2)' }}
                />
              </div>
              {pwdError && <p className="font-body text-sm text-red-400">{pwdError}</p>}
              {pwdMsg && <p className="font-body text-sm text-green-400">{pwdMsg}</p>}
              <button
                type="submit"
                disabled={pwdLoading}
                className="bg-green-700 px-6 py-2.5 font-body text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-green-600 disabled:opacity-60 transition-colors"
              >
                {pwdLoading ? 'Mise à jour…' : 'Mettre à jour'}
              </button>
            </form>
          </div>

          {/* Right — Billing */}
          <div className="p-6" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-green-600">Plan &amp; Upgrade</p>
                <h2 className="font-display text-2xl uppercase text-white">Facturation</h2>
              </div>
              <span
                className="px-2 py-1 font-body text-[9px] font-bold uppercase tracking-wider"
                style={{ border: '1px solid rgba(22,163,74,0.3)', color: 'rgba(22,163,74,0.9)' }}
              >
                Actif
              </span>
            </div>

            {/* Current plan */}
            {quota && (
              <div className="mb-5 p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.2)' }}>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Offre active</p>
                <div className="mt-1 flex items-start justify-between">
                  <div>
                    <p className="font-display text-3xl uppercase text-white">{quota.plan}</p>
                    <p className="font-body text-xs text-slate-400">
                      {quota.plan === 'starter' ? 'Pour tester Tifo et lancer vos premiers visuels.' : quota.plan === 'pro' ? 'Pour les créateurs qui publient régulièrement.' : 'Pour les clubs et médias avec plusieurs équipes.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-xs text-slate-500">Prix</p>
                    <p className="font-body text-sm font-semibold text-white">
                      {quota.plan === 'starter' ? 'Gratuit' : quota.plan === 'pro' ? '9€/mois' : '29€/mois'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="p-2.5" style={{ background: 'rgba(5,46,22,0.3)', border: '1px solid rgba(22,163,74,0.1)' }}>
                    <p className="font-body text-[9px] font-bold uppercase tracking-wider text-slate-600">Activé le</p>
                    <p className="font-body text-xs text-white">Compte gratuit</p>
                  </div>
                  <div className="p-2.5" style={{ background: 'rgba(5,46,22,0.3)', border: '1px solid rgba(22,163,74,0.1)' }}>
                    <p className="font-body text-[9px] font-bold uppercase tracking-wider text-slate-600">Référence</p>
                    <p className="font-body text-xs text-slate-500">Aucune référence</p>
                  </div>
                </div>
                <p className="mt-2 font-body text-xs text-slate-500">
                  {quota.quota_total - quota.quota_remaining}/{quota.quota_total} générées
                </p>
              </div>
            )}

            {/* Upgrade options */}
            {quota?.plan === 'starter' && (
              <>
                <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Options disponibles</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-display text-xl uppercase text-white">Pro</p>
                      <span className="font-body text-xs font-bold text-white">9€/mois</span>
                    </div>
                    <ul className="mb-4 space-y-1">
                      {['Affiches illimitées', 'Tous les formats', 'Sans filigrane', 'Export HD'].map((f) => (
                        <li key={f} className="font-body text-[10px] text-slate-400">• {f}</li>
                      ))}
                    </ul>
                    <Link
                      href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ?? '/#pricing'}
                      className="block w-full bg-green-700 py-2 text-center font-body text-[10px] font-black uppercase tracking-[0.15em] text-white hover:bg-green-600 transition-colors"
                    >
                      Passer sur Pro
                    </Link>
                  </div>
                  <div className="p-4" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.2)' }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-display text-xl uppercase text-white">Club</p>
                      <span className="font-body text-xs font-bold text-white">29€/mois</span>
                    </div>
                    <ul className="mb-4 space-y-1">
                      {['Tout ce qu\'il y a dans Pro', 'Multi-équipes', 'Palette custom', 'Formats custom'].map((f) => (
                        <li key={f} className="font-body text-[10px] text-slate-400">• {f}</li>
                      ))}
                    </ul>
                    <Link
                      href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CLUB ?? '/#pricing'}
                      className="block w-full bg-green-700 py-2 text-center font-body text-[10px] font-black uppercase tracking-[0.15em] text-white hover:bg-green-600 transition-colors"
                    >
                      Passer sur Club
                    </Link>
                  </div>
                </div>
                <p className="mt-3 font-body text-[10px] uppercase tracking-[0.15em] text-slate-600">
                  Vous êtes libre de changer de formule à tout moment. Sans engagement.
                </p>
              </>
            )}

            {(quota?.plan === 'pro' || quota?.plan === 'club') && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-4 font-body text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                {cancelling ? 'Annulation…' : 'Annuler mon abonnement'}
              </button>
            )}
          </div>
        </div>

        {/* Billing history */}
        <div>
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-px w-6 bg-green-600" />
              <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Historique</p>
            </div>
            <h2 className="font-display text-2xl uppercase text-white">Historique de facturation</h2>
          </div>

          {loading ? (
            <div
              className="p-12 text-center font-body text-sm text-slate-500"
              style={{ background: 'rgba(5,46,22,0.1)', border: '1px solid rgba(22,163,74,0.1)' }}
            >
              Chargement…
            </div>
          ) : payments.length === 0 ? (
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
              <p className="mt-4 font-display text-xl uppercase text-white">Aucun paiement pour le moment</p>
              <p className="mt-2 font-body text-sm text-slate-400">
                Vos futurs achats apparaîtront ici avec la formule souscrite, le montant et la date.
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(5,46,22,0.1)', border: '1px solid rgba(22,163,74,0.1)' }}>
              {payments.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5"
                  style={i > 0 ? { borderTop: '1px solid rgba(22,163,74,0.1)' } : {}}
                >
                  <div>
                    <p className="font-body text-sm text-white capitalize">
                      {p.event_type === 'upgrade' ? 'Abonnement' : p.event_type}
                    </p>
                    <p className="font-body text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm font-bold text-green-400">{(p.amount / 100).toFixed(2)}€</p>
                    <p className="font-body text-xs capitalize text-slate-600">{p.status}</p>
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
