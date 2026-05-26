'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
  is_admin: boolean;
  plan: string;
  quota_remaining: number;
  quota_total: number;
  trial_ends_at: string | null;
}

interface AdminHistoryItem {
  id: number;
  action_type: string;
  actor_email: string | null;
  target_email: string | null;
  metadata: { template?: string; requestedPlan?: string; subject?: string; quotaRemaining?: number; isAdmin?: boolean } | null;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalRevenueCents: number;
  totalPayments: number;
  totalPosters: number;
  planBreakdown: { plan: string; count: number }[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<AdminHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuota, setEditQuota] = useState('');
  const [planLoadingUserId, setPlanLoadingUserId] = useState<number | null>(null);
  const [emailLoadingUserId, setEmailLoadingUserId] = useState<number | null>(null);
  const [adminLoadingUserId, setAdminLoadingUserId] = useState<number | null>(null);
  const [selectedPlanByUser, setSelectedPlanByUser] = useState<Record<number, string>>({});
  const [selectedTemplateByUser, setSelectedTemplateByUser] = useState<Record<number, string>>({});
  const [customSubjectByUser, setCustomSubjectByUser] = useState<Record<number, string>>({});
  const [customMessageByUser, setCustomMessageByUser] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.isAdmin) {
      router.push('/dashboard');
      return;
    }
    async function load() {
      const [uRes, sRes, hRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/history'),
      ]);
      if (uRes.ok) {
        setUsers(await uRes.json());
      } else {
        const data = await uRes.json().catch(() => ({ error: 'Erreur de chargement utilisateurs.' }));
        setLoadError(data.error ?? 'Erreur de chargement utilisateurs.');
      }
      if (sRes.ok) setStats(await sRes.json());
      if (hRes.ok) setHistory(await hRes.json());
      setLoading(false);
    }
    load();
  }, [session, status, router]);

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.email} ${user.name ?? ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  async function saveQuota(userId: number) {
    await fetch('/api/admin/quota', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, quotaRemaining: Number(editQuota) }),
    });
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, quota_remaining: Number(editQuota) } : u)
    );
    setEditingId(null);
  }

  async function updatePlan(userId: number) {
    const selectedPlan = selectedPlanByUser[userId] ?? 'starter';
    const currentUser = users.find((user) => user.id === userId);

    const isSensitiveDowngrade = currentUser
      && currentUser.plan !== 'starter'
      && selectedPlan === 'starter';

    if (isSensitiveDowngrade && !window.confirm('Confirmer le passage de cet utilisateur vers Starter ?')) {
      return;
    }

    setPlanLoadingUserId(userId);
    setFeedback('');

    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: selectedPlan }),
    });

    setPlanLoadingUserId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Erreur inconnue.' }));
      setFeedback(data.error ?? 'Impossible de mettre à jour le plan.');
      return;
    }

    const updatedUsers = await fetch('/api/admin/users');
    if (updatedUsers.ok) {
      setUsers(await updatedUsers.json());
    }
    const updatedHistory = await fetch('/api/admin/history');
    if (updatedHistory.ok) {
      setHistory(await updatedHistory.json());
    }
    setFeedback('Plan mis à jour.');
  }

  async function sendTemplate(userId: number) {
    const template = selectedTemplateByUser[userId] ?? 'welcome';

    if (template === 'trial_ended' && !window.confirm('Confirmer l\'envoi du mail de fin d\'essai ?')) {
      return;
    }

    const subject = customSubjectByUser[userId] ?? '';
    const message = customMessageByUser[userId] ?? '';

    if (template === 'custom' && (!subject.trim() || !message.trim())) {
      setFeedback('Sujet et message sont requis pour un email custom.');
      return;
    }

    setEmailLoadingUserId(userId);
    setFeedback('');

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, template, subject, message }),
    });

    setEmailLoadingUserId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Erreur inconnue.' }));
      setFeedback(data.error ?? 'Impossible d\'envoyer l\'email.');
      return;
    }

    setFeedback('Email envoyé.');

    const updatedHistory = await fetch('/api/admin/history');
    if (updatedHistory.ok) {
      setHistory(await updatedHistory.json());
    }
  }

  async function toggleAdmin(userId: number, nextValue: boolean) {
    if (!nextValue && !window.confirm('Confirmer le retrait du rôle admin pour cet utilisateur ?')) {
      return;
    }

    setAdminLoadingUserId(userId);
    setFeedback('');

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: nextValue }),
    });

    setAdminLoadingUserId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Erreur inconnue.' }));
      setFeedback(data.error ?? 'Impossible de mettre à jour le rôle admin.');
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_admin: nextValue } : u)));
    const updatedHistory = await fetch('/api/admin/history');
    if (updatedHistory.ok) {
      setHistory(await updatedHistory.json());
    }
    setFeedback(nextValue ? 'Utilisateur promu admin.' : 'Utilisateur retiré des admins.');
  }

  if (status === 'loading' || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#020f07] text-white">Chargement…</div>;
  }

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020f07]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-12">
        <h1 className="font-display text-4xl uppercase text-white mb-8">Administration</h1>
        {feedback && (
          <p className="mb-4 rounded border border-green-900/40 bg-green-950/20 px-4 py-2 text-sm text-green-300">
            {feedback}
          </p>
        )}
        {loadError && (
          <p className="mb-4 rounded border border-red-900/40 bg-red-950/20 px-4 py-2 text-sm text-red-300">
            {loadError}
          </p>
        )}

        {/* Stats */}
        {stats && (
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Utilisateurs', value: stats.totalUsers },
              { label: 'Affiches générées', value: stats.totalPosters },
              { label: 'Revenus', value: `${(stats.totalRevenueCents / 100).toFixed(2)}€` },
              { label: 'Paiements', value: stats.totalPayments },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-green-900/30 bg-green-950/10 p-5">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-display text-3xl text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Plan breakdown */}
        {stats && stats.planBreakdown.length > 0 && (
          <div className="mb-10 rounded-xl border border-green-900/30 bg-green-950/10 p-6">
            <h2 className="font-semibold text-white mb-4">Répartition des plans</h2>
            <div className="flex gap-6 flex-wrap">
              {stats.planBreakdown.map((p) => (
                <div key={p.plan} className="text-center">
                  <p className="text-2xl font-display text-green-400">{p.count}</p>
                  <p className="text-xs text-gray-500 capitalize">{p.plan}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur par email"
            className="w-full rounded-xl border border-green-900/30 bg-green-950/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-green-900/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-950/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fin essai</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Quota restant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Inscrit le</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-900/20">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-green-950/10">
                  <td className="px-4 py-3 text-white">
                    <div>{user.email}</div>
                    {user.name && <div className="text-xs text-gray-500">{user.name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.plan === 'club' ? 'bg-purple-900/40 text-purple-300' :
                      user.plan === 'pro' ? 'bg-green-900/40 text-green-300' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      user.is_admin ? 'bg-green-900/40 text-green-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {user.is_admin ? 'admin' : 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.trial_ends_at
                      ? new Date(user.trial_ends_at).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editQuota}
                          onChange={(e) => setEditQuota(e.target.value)}
                          className="w-20 rounded border border-green-900/40 bg-[#020f07] px-2 py-1 text-white text-xs"
                        />
                        <button onClick={() => saveQuota(user.id)} className="text-xs text-green-400 hover:text-green-300">✓</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-white">✕</button>
                      </div>
                    ) : (
                      <span>{user.quota_total === 999999 ? '∞' : `${user.quota_remaining} / ${user.quota_total}`}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => { setEditingId(user.id); setEditQuota(String(user.quota_remaining)); }}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Modifier quota
                      </button>

                      <select
                        value={selectedPlanByUser[user.id] ?? user.plan}
                        onChange={(e) => setSelectedPlanByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                        className="rounded border border-green-900/40 bg-[#020f07] px-2 py-1 text-xs text-white"
                      >
                        <option value="starter">starter</option>
                        <option value="pro">pro</option>
                        <option value="club">club</option>
                        <option value="club_trial_90">club_trial_90j</option>
                      </select>
                      <button
                        onClick={() => updatePlan(user.id)}
                        disabled={planLoadingUserId === user.id}
                        className="rounded border border-green-900/40 px-2 py-1 text-xs text-green-300 hover:bg-green-900/20 disabled:opacity-60"
                      >
                        {planLoadingUserId === user.id ? '...' : 'Appliquer plan'}
                      </button>

                      <select
                        value={selectedTemplateByUser[user.id] ?? 'welcome'}
                        onChange={(e) => setSelectedTemplateByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                        className="rounded border border-green-900/40 bg-[#020f07] px-2 py-1 text-xs text-white"
                      >
                        <option value="welcome">welcome</option>
                        <option value="trial_welcome">trial_welcome</option>
                        <option value="trial_reminder_7">trial_reminder_7</option>
                        <option value="trial_ended">trial_ended</option>
                        <option value="custom">custom</option>
                      </select>
                      {selectedTemplateByUser[user.id] === 'custom' && (
                        <>
                          <input
                            type="text"
                            value={customSubjectByUser[user.id] ?? ''}
                            onChange={(e) => setCustomSubjectByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="Sujet"
                            className="rounded border border-green-900/40 bg-[#020f07] px-2 py-1 text-xs text-white placeholder:text-gray-500"
                          />
                          <textarea
                            value={customMessageByUser[user.id] ?? ''}
                            onChange={(e) => setCustomMessageByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="Message"
                            className="min-h-20 rounded border border-green-900/40 bg-[#020f07] px-2 py-1 text-xs text-white placeholder:text-gray-500"
                          />
                        </>
                      )}
                      <button
                        onClick={() => sendTemplate(user.id)}
                        disabled={emailLoadingUserId === user.id}
                        className="rounded border border-green-900/40 px-2 py-1 text-xs text-green-300 hover:bg-green-900/20 disabled:opacity-60"
                      >
                        {emailLoadingUserId === user.id ? '...' : 'Envoyer email'}
                      </button>

                      <button
                        onClick={() => toggleAdmin(user.id, !user.is_admin)}
                        disabled={adminLoadingUserId === user.id || String(user.id) === session.user.id}
                        className="rounded border border-green-900/40 px-2 py-1 text-xs text-green-300 hover:bg-green-900/20 disabled:opacity-60"
                        title={String(user.id) === session.user.id ? 'Vous ne pouvez pas modifier votre propre rôle ici.' : ''}
                      >
                        {adminLoadingUserId === user.id
                          ? '...'
                          : user.is_admin
                            ? 'Retirer admin'
                            : 'Promouvoir admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun utilisateur trouvé ou chargement impossible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-xl border border-green-900/30 bg-green-950/10 p-6">
          <h2 className="mb-4 font-semibold text-white">Historique admin</h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded border border-green-900/20 bg-black/10 px-4 py-3 text-sm text-gray-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{item.action_type}</p>
                  <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {item.actor_email ?? 'Système'} → {item.target_email ?? 'Utilisateur supprimé'}
                </p>
                {item.metadata && (
                  <p className="mt-1 text-xs text-gray-500">{JSON.stringify(item.metadata)}</p>
                )}
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-sm text-gray-500">Aucune action admin enregistrée pour le moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
