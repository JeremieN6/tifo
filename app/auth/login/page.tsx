'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';

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

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <AuthShell title="Connexion" subtitle="Content de te revoir !">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="toi@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <div className="text-center text-sm text-gray-500 space-y-2">
          <Link href="/auth/forgot-password" className="block hover:text-white transition-colors">
            Mot de passe oublié ?
          </Link>
          <span>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-green-400 hover:text-green-300">
              Créer un compte
            </Link>
          </span>
        </div>
      </form>
    </AuthShell>
  );
}
