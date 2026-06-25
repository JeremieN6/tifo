import type { Metadata } from 'next';
import { Bebas_Neue, Barlow } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const barlow = Barlow({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tifo — Générateur d\'affiches de match',
  description: 'Générez des affiches de match percutantes grâce à l\'IA, en quelques clics.',
  verification: {
    google: 'dS4lDtb3GkUFSthFb5DQkzfwTUYCP_dKFWE5m1s7V8E',
  },
  openGraph: {
    title: 'Tifo — Générateur d\'affiches de match',
    description: 'Générez des affiches de match percutantes, automatiquement.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bebasNeue.variable} ${barlow.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
