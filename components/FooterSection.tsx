import Link from 'next/link';

export default function FooterSection() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t bg-[#020f07] px-6 py-16 md:px-12" style={{ borderColor: 'rgba(22, 163, 74, 0.1)' }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="font-display text-4xl uppercase text-green-600 hover:text-green-500 transition-colors" aria-label="Tifo">
              TIFO
            </Link>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-slate-500">
              Générateur d&apos;affiches de match par IA. Pour les clubs, les médias et les créateurs qui veulent communiquer comme des pros.
            </p>
            <div
              className="mt-6 inline-block px-3 py-1 font-body text-[10px] font-black uppercase tracking-[0.25em]"
              style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.25)', color: 'rgba(22, 163, 74, 0.9)' }}
            >
              Lancement — Bêta
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-body text-xs font-black uppercase tracking-[0.3em] text-slate-600">Navigation</p>
            <nav className="mt-4 flex flex-col gap-3">
              {[
                { label: 'Fonctionnalités', href: '/#fonctionnalites' },
                { label: 'Comment ça marche', href: '/#how-it-works' },
                { label: 'Tarifs', href: '/#pricing' },
                { label: 'FAQ', href: '/#faq' },
                { label: 'Connexion', href: '/auth/login' },
                { label: 'Créer un compte', href: '/auth/register' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body text-sm text-slate-500 transition-colors hover:text-green-500"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* À propos */}
          <div>
            <p className="font-body text-xs font-black uppercase tracking-[0.3em] text-slate-600">À propos</p>
            <p className="mt-4 font-body text-sm leading-relaxed text-slate-500">
              Tifo est un projet indépendant développé par{' '}
              <a
                className="text-slate-400 underline underline-offset-2 hover:text-green-500 transition-colors"
                href="https://sassify.fr"
                rel="noopener noreferrer"
                target="_blank"
              >
                sassify
              </a>
              . Chaque affiche est générée par intelligence artificielle, en temps réel.
            </p>
            <p className="mt-3 font-body text-sm text-slate-500">
              Contact :{' '}
              <a
                className="text-slate-400 underline underline-offset-2 hover:text-green-500 transition-colors"
                href="mailto:contact.tifo@sassify.fr"
              >
                contact.tifo@sassify.fr
              </a>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row" style={{ borderTop: '1px solid rgba(22, 163, 74, 0.08)' }}>
          <p className="font-body text-xs text-slate-600">© {year} Tifo · Sassify. Tous droits réservés.</p>
          <p className="scoreboard font-body text-xs text-slate-700 tracking-[0.2em]">TIFO / GENERATEUR D&apos;AFFICHES / LANCEMENT</p>
        </div>
      </div>
    </footer>
  );
}
