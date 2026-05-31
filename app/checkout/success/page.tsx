'use client';
import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import { captureClientEvent } from '@/lib/analytics-client';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') ?? 'pro';

  useEffect(() => {
    captureClientEvent('checkout_success_page_viewed', { plan });

    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, plan]);

  const messages: Record<string, { title: string; text: string }> = {
    pro: {
      title: 'Bienvenue dans le plan Pro !',
      text: 'Ton abonnement Pro est actif. Tu bénéficies désormais d\'affiches illimitées chaque mois.',
    },
    club: {
      title: 'Bienvenue dans le plan Club !',
      text: 'Ton abonnement Club est actif. Tu bénéficies d\'un accès prioritaire à l\'IA et d\'affiches illimitées.',
    },
  };

  const msg = messages[plan] ?? messages.pro;

  return (
    <AuthShell title={msg.title}>
      <div className="text-center space-y-6">
        <div className="text-5xl">🏆</div>
        <p className="text-gray-300">{msg.text}</p>
        <p className="text-sm text-gray-500">
          Si ton quota n&apos;est pas encore mis à jour, patiente quelques instants et recharge la page.
        </p>
        <p className="text-xs text-gray-500">Redirection automatique vers ton dashboard…</p>
        <Link
          href="/dashboard"
          className="block rounded-md bg-green-500 px-6 py-3 text-sm font-semibold text-black hover:bg-green-400 transition-colors"
        >
          Aller à mon tableau de bord
        </Link>
        <Link href="/create" className="block text-sm text-green-400 hover:text-green-300">
          Créer une affiche maintenant →
        </Link>
      </div>
    </AuthShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<AuthShell title="Chargement…"><div /></AuthShell>}>
      <SuccessContent />
    </Suspense>
  );
}
