'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Créer le compte
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Erreur lors de l\'inscription.');
      setLoading(false);
      return;
    }

    // Connexion automatique
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Compte créé, mais erreur lors de la connexion. Connecte-toi manuellement.');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <AuthShell title="Créer un compte" subtitle="5 affiches gratuites pour commencer">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Prénom ou pseudo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="Thomas"
          />
        </div>
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
            minLength={8}
            className="w-full rounded-md border border-green-900/40 bg-[#020f07] px-4 py-2.5 text-white placeholder-gray-600 focus:border-green-500 focus:outline-none"
            placeholder="8 caractères minimum"
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
          {loading ? 'Création du compte…' : 'Créer mon compte gratuitement'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-green-400 hover:text-green-300">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
