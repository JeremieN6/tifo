'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { captureClientEvent } from '@/lib/analytics-client';

const leftCards = [
  { title: 'Votre espace', sub: 'Accès direct' },
  { title: 'Vos affiches', sub: 'Création\nrelancée' },
  { title: 'Post & Story', sub: 'Formats prêts' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      captureClientEvent('login_failed', {
        reason: result.error,
      });
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      captureClientEvent('login_succeeded');
      router.push('/dashboard');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#020f07]">
      {/* Grid overlay */}
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
      <div className="relative hidden flex-col justify-between py-12 md:flex">
        <Link aria-label="Tifo" href="/" className="font-display text-3xl uppercase">
          <span className="text-white">TI</span>
          <span className="text-green-600">FO</span>
        </Link>

        <div>
          <div className="badge-beta mt-10 mb-8 inline-flex rounded-full border border-green-800/50 items-center gap-2 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.2em]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Authentification sécurisée
          </div>

          <h1
            className="font-display uppercase leading-[0.9] text-white"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.02em' }}
          >
            Reprenez la main
            <br />sur vos{' '}
            <span className="text-gradient-green">affiches.</span>
          </h1>

          <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-slate-400">
            Connectez-vous pour retrouver votre espace Tifo, relancer vos créations et reprendre la main sur vos affiches.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {leftCards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-2 p-4"
                style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.12)' }}
              >
                <span className="font-display text-2xl uppercase text-white" style={{ letterSpacing: '-0.01em' }}>{card.title}</span>
                <span className="whitespace-pre-line font-body text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">{card.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div />
      </div>

      {/* Right column — form */}
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md p-8 md:p-10" style={{ background: 'rgba(5,46,22,0.15)', border: '1px solid rgba(22,163,74,0.2)' }}>
          {/* Mobile logo */}
          <Link aria-label="Tifo" href="/" className="mb-8 block font-display text-3xl uppercase md:hidden">
            <span className="text-white">TI</span>
            <span className="text-green-600">FO</span>
          </Link>

          <p className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">Connexion</p>
          <h2 className="mt-1 font-display text-4xl uppercase text-white" style={{ letterSpacing: '-0.01em' }}>
            Bon retour
          </h2>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Email</label>
              <input
                required
                autoComplete="email"
                className="w-full bg-[#020f07] px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                placeholder="coach@club.fr"
                style={{ border: '1px solid rgba(22,163,74,0.2)' }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-body text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Mot de passe</label>
              <input
                required
                autoComplete="current-password"
                className="w-full bg-[#020f07] px-4 py-3 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                placeholder="Au moins 8 caractères"
                style={{ border: '1px solid rgba(22,163,74,0.2)' }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Link className="font-body text-xs font-semibold text-green-500 hover:text-green-400 transition-colors" href="/auth/forgot-password">
                Mot de passe oublié ?
              </Link>
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
              <span className="relative z-10">{loading ? 'Connexion…' : 'Se connecter'}</span>
            </button>
          </form>

          <p className="mt-6 font-body text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link className="font-semibold text-green-500 hover:text-green-400 transition-colors" href="/auth/register">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
