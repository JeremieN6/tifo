'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Erreur lors de la réinitialisation.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/auth/login'), 2000);
  }

  if (!token) {
    return (
      <AuthShell title="Lien invalide">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Ce lien de réinitialisation est invalide ou expiré.</p>
          <Link href="/auth/forgot-password" className="text-green-400 hover:text-green-300 text-sm">
            Demander un nouveau lien
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title="Mot de passe mis à jour !">
        <div className="text-center space-y-4">
          <div className="text-4xl">✅</div>
          <p className="text-gray-300">Ton mot de passe a été réinitialisé avec succès. Redirection…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisis un nouveau mot de passe sécurisé">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="8 caractères minimum"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-900/30 border border-red-700/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Mise à jour…' : 'Réinitialiser mon mot de passe'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Chargement…"><div /></AuthShell>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
