'use client';
import { useState } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <AuthShell title="Email envoyé">
        <div className="text-center space-y-4">
          <div className="text-4xl">📬</div>
          <p className="text-gray-300">
            Si un compte existe avec cet email, tu recevras un lien de réinitialisation dans quelques minutes.
          </p>
          <p className="text-sm text-gray-500">Pense à vérifier tes spams.</p>
          <Link href="/auth/login" className="block mt-4 text-green-400 hover:text-green-300 text-sm">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Mot de passe oublié" subtitle="Saisis ton email pour recevoir un lien de réinitialisation">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-green-500 py-3 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>

        <p className="text-center text-sm text-gray-500">
          <Link href="/auth/login" className="text-green-400 hover:text-green-300">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
