'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar({ createStep }: { createStep?: { current: number; total: number } } = {}) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {createStep ? (
        /* ── Create page nav ── */
        <nav className="relative z-10 flex items-center justify-between border-b border-green-900/40 px-6 py-3 md:px-12">
          <Link
            href="/"
            className="scoreboard font-display text-lg tracking-[0.15em] text-white transition-colors duration-200 hover:text-green-400"
          >
            TI<span className="text-green-500">FO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="hidden rounded-full border border-white/10 px-4 py-2 font-body text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-green-500/60 hover:text-white sm:inline-flex"
            >
              Compte
            </Link>
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-white/10 px-4 py-2 font-body text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-green-500/60 hover:text-white sm:inline-flex"
            >
              Dashboard
            </Link>
            <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-green-500/60">
              Étape {createStep.current + 1} / {createStep.total}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="border border-green-800/60 px-3 py-2 font-body text-[10px] font-black uppercase tracking-[0.18em] text-slate-200 transition-colors hover:border-green-500 hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </nav>
      ) : (
        /* ── Regular nav ── */
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-green-900/20 bg-[#020f07]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
            <Link href="/" className="font-display text-3xl uppercase leading-none tracking-tight">
              <span className="text-white">TI</span>
              <span className="text-green-600">FO</span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              <Link href="#fonctionnalites" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 transition-colors duration-200 hover:text-green-400">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 transition-colors duration-200 hover:text-green-400">
                Tarif
              </Link>
              <Link href="#faq" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400 transition-colors duration-200 hover:text-green-400">
                FAQ
              </Link>
              {session && (
                <>
                  <Link
                    href="/account"
                    className="rounded-full border border-white/20 px-4 py-1.5 font-body text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-green-500/60 hover:text-white"
                  >
                    Compte
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-white/20 px-4 py-1.5 font-body text-[10px] font-black uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-green-500/60 hover:text-white"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {session ? (
                <>
                  {/* Club / user name */}
                  <span className="hidden max-w-[140px] truncate font-body text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 sm:block">
                    {session.user?.name ?? session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="hidden font-body text-xs font-black uppercase tracking-[0.2em] text-slate-300 transition-colors duration-200 hover:text-white sm:block"
                  >
                    Déconnexion
                  </button>
                  <Link
                    href="/create"
                    className="group relative overflow-hidden bg-green-700 px-5 py-2.5 font-body text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  >
                    <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative z-10">Créer mon affiche</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="hidden font-body text-xs font-black uppercase tracking-[0.2em] text-slate-300 transition-colors duration-200 hover:text-green-400 sm:block"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="group relative overflow-hidden bg-green-700 px-5 py-2.5 font-body text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  >
                    <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <span className="relative z-10">Créer mon compte</span>
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                className="ml-2 text-white md:hidden"
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
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="flex flex-col gap-4 border-t border-green-900/20 bg-[#020f07] px-6 py-4 md:hidden">
              <Link href="#fonctionnalites" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400" onClick={() => setMenuOpen(false)}>Fonctionnalités</Link>
              <Link href="#pricing" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400" onClick={() => setMenuOpen(false)}>Tarif</Link>
              <Link href="#faq" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400" onClick={() => setMenuOpen(false)}>FAQ</Link>
              {session ? (
                <>
                  <span className="truncate font-body text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{session.user?.name ?? session.user?.email}</span>
                  <Link href="/account" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400" onClick={() => setMenuOpen(false)}>Compte</Link>
                  <Link href="/dashboard" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <Link href="/create" className="text-xs font-black uppercase tracking-[0.2em] text-green-400" onClick={() => setMenuOpen(false)}>Créer mon affiche</Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400" onClick={() => setMenuOpen(false)}>Connexion</Link>
                  <Link href="/auth/register" className="text-xs font-black uppercase tracking-[0.2em] text-green-400" onClick={() => setMenuOpen(false)}>Créer mon compte</Link>
                </>
              )}
            </div>
          )}
        </nav>
      )}
    </>
  );
}
