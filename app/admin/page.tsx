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
  plan: string;
  quota_remaining: number;
  quota_total: number;
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
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuota, setEditQuota] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.isAdmin) {
      router.push('/dashboard');
      return;
    }
    async function load() {
      const [uRes, sRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setStats(await sRes.json());
      setLoading(false);
    }
    load();
  }, [session, status, router]);

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

  if (status === 'loading' || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#020f07] text-white">Chargement…</div>;
  }

  if (!session?.user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020f07]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-12">
        <h1 className="font-display text-4xl uppercase text-white mb-8">Administration</h1>

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

        {/* Users table */}
        <div className="rounded-xl border border-green-900/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-950/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Quota restant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Inscrit le</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-900/20">
              {users.map((user) => (
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
                    <button
                      onClick={() => { setEditingId(user.id); setEditQuota(String(user.quota_remaining)); }}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      Modifier quota
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
