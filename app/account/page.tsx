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

const planLabel: Record<string, string> = {
  starter: 'Starter (Gratuit)',
  pro: 'Pro — 9€/mois',
  club: 'Club — 29€/mois',
};

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
      <main className="mx-auto max-w-2xl px-6 pb-16 pt-28 md:px-12 space-y-10">
        <div>
          <h1 className="font-display text-4xl uppercase text-white">Mon compte</h1>
          <p className="text-gray-400 mt-1">{session?.user?.email}</p>
        </div>

        {/* Plan & quota */}
        <section className="rounded-xl border border-green-900/30 bg-green-950/10 p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg">Plan actuel</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Chargement…</p>
          ) : quota ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Plan</span>
                <span className="font-semibold text-white capitalize">{planLabel[quota.plan] ?? quota.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Affiches restantes</span>
                <span className="font-semibold text-green-400">
                  {quota.quota_total === 999999 ? 'Illimité' : `${quota.quota_remaining} / ${quota.quota_total}`}
                </span>
              </div>
              {quota.plan === 'starter' && (
                <div className="pt-2 flex gap-3">
                  <Link
                    href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ?? '/#pricing'}
                    className="flex-1 rounded-md bg-green-500 px-4 py-2 text-center text-sm font-semibold text-black hover:bg-green-400 transition-colors"
                  >
                    Passer au Pro (9€/mois)
                  </Link>
                  <Link
                    href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CLUB ?? '/#pricing'}
                    className="flex-1 rounded-md border border-green-900/40 px-4 py-2 text-center text-sm text-white hover:border-green-500/50 transition-colors"
                  >
                    Passer au Club (29€/mois)
                  </Link>
                </div>
              )}
              {(quota.plan === 'pro' || quota.plan === 'club') && (
                <div className="pt-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                  >
                    {cancelling ? 'Annulation…' : 'Annuler mon abonnement'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* Billing history */}
        <section className="rounded-xl border border-green-900/30 bg-green-950/10 p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg">Historique de facturation</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Chargement…</p>
          ) : payments.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun paiement enregistré.</p>
          ) : (
            <div className="divide-y divide-green-900/20">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="text-white capitalize">{p.event_type === 'upgrade' ? 'Abonnement' : p.event_type}</p>
                    <p className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">{(p.amount / 100).toFixed(2)}€</p>
                    <p className="text-xs text-gray-600 capitalize">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Change password */}
        <section className="rounded-xl border border-green-900/30 bg-green-950/10 p-6 space-y-4">
          <h2 className="font-semibold text-white text-lg">Changer de mot de passe</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
                className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            {pwdError && <p className="text-sm text-red-400">{pwdError}</p>}
            {pwdMsg && <p className="text-sm text-green-400">{pwdMsg}</p>}
            <button
              type="submit"
              disabled={pwdLoading}
              className="rounded-md bg-green-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-60 transition-colors"
            >
              {pwdLoading ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
