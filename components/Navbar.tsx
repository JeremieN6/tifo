'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-green-900/20 bg-[#020f07]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" className="font-display text-3xl uppercase leading-none tracking-tight">
          <span className="text-white">TI</span>
          <span className="text-green-500">FO</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
            Comment ça marche
          </Link>
          <Link href="/#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tarifs
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                Tableau de bord
              </Link>
              <Link href="/create" className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400 transition-colors">
                Créer une affiche
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link href="/auth/register" className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400 transition-colors">
                Commencer gratuitement
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-green-900/20 bg-[#020f07] px-6 py-4 flex flex-col gap-4">
          <Link href="/#how-it-works" className="text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Comment ça marche</Link>
          <Link href="/#pricing" className="text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Tarifs</Link>
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Tableau de bord</Link>
              <Link href="/create" className="text-sm font-semibold text-green-400" onClick={() => setMenuOpen(false)}>Créer une affiche</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left text-sm text-gray-500">Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-400" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <Link href="/auth/register" className="text-sm font-semibold text-green-400" onClick={() => setMenuOpen(false)}>Commencer gratuitement</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
