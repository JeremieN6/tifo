'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const AuthLayout = ({ label, title, children }: { label: string; title: string; children: React.ReactNode }) => (
  <div className="relative min-h-screen bg-[#020f07]">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: 'linear-gradient(rgba(22,163,74,1) 1px, transparent 1px), linear-gradient(90deg, rgba(22,163,74,1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
    <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-2">
      {/* Left column */}
      <div className="hidden flex-col justify-between py-12 md:flex">
        <Link aria-label="Tifo" href="/" className="font-display text-3xl uppercase">
          <span className="text-white">TI</span>
          <span className="text-green-600">FO</span>
        </Link>
        <div>
          <div className="badge-beta mb-8 inline-flex items-center gap-2 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.2em]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Sécurité du compte
          </div>
          <h1
            className="font-display uppercase leading-[0.9] text-white"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.02em' }}
          >
            Créez un nouveau
            <br />mot de{' '}
            <span className="text-gradient-green">passe.</span>
          </h1>
          <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-slate-400">
            Choisissez un mot de passe sécurisé d&apos;au moins 8 caractères. Ce lien est valable une heure.
          </p>
        </div>
        <div />
      </div>

      {/* Right column */}
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-8 md:p-10" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
          <Link aria-label="Tifo" href="/" className="mb-8 block font-display text-3xl uppercase md:hidden">
            <span className="text-white">TI</span>
            <span className="text-green-600">FO</span>
          </Link>
          <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">{label}</p>
          <h2 className="mt-1 font-display text-4xl uppercase text-white" style={{ letterSpacing: '-0.01em' }}>{title}</h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  </div>
);

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
      <AuthLayout label="Lien invalide" title="Lien expiré">
        <p className="font-body text-sm leading-relaxed text-slate-400">Ce lien de réinitialisation est invalide ou expiré.</p>
        <Link
          className="mt-4 block font-body text-sm font-semibold text-green-500 hover:text-green-400 transition-colors"
          href="/auth/forgot-password"
        >
          Demander un nouveau lien →
        </Link>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout label="Succès" title="Mot de passe mis à jour">
        <p className="font-body text-sm leading-relaxed text-slate-400">
          Votre mot de passe a été réinitialisé avec succès. Redirection en cours…
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout label="Réinitialisation" title="Nouveau mot de passe">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Nouveau mot de passe</label>
          <input
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full bg-[#020f07] px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
            placeholder="Au moins 8 caractères"
            style={{ border: '1px solid rgba(22,163,74,0.2)' }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Confirmer le mot de passe</label>
          <input
            required
            autoComplete="new-password"
            className="w-full bg-[#020f07] px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
            placeholder="Répétez votre mot de passe"
            style={{ border: '1px solid rgba(22,163,74,0.2)' }}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="px-3 py-2 font-body text-sm text-red-400" style={{ background: 'rgba(153,27,27,0.2)', border: '1px solid rgba(153,27,27,0.4)' }}>
            {error}
          </p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="group relative w-full overflow-hidden bg-green-700 py-4 font-body text-sm font-black uppercase tracking-[0.25em] text-white transition-all duration-300 hover:bg-green-600 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          <span className="relative z-10">{loading ? 'Mise à jour…' : 'Réinitialiser mon mot de passe'}</span>
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout label="Chargement" title="…">
        <div />
      </AuthLayout>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
