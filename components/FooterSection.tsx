import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="border-t border-green-900/20 bg-[#020f07] px-6 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Link href="/" className="font-display text-2xl uppercase tracking-tight">
            <span className="text-white">TI</span>
            <span className="text-green-500">FO</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link href="/#how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Tarifs</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="/auth/register" className="hover:text-white transition-colors">Inscription</Link>
          </nav>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Tifo · NanoCorp</p>
        </div>
      </div>
    </footer>
  );
}
