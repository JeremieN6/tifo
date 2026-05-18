'use client';
import { useState } from 'react';

const faqs = [
  {
    q: 'Le plan Starter est-il vraiment gratuit ?',
    a: 'Oui. Le plan Starter est offert au lancement pour les 200 premiers comptes et donne droit à 5 affiches par mois sans carte bancaire. Les plans Pro et Club débloquent un usage illimité.',
  },
  {
    q: 'Quels formats d\'affiche sont disponibles ?',
    a: 'Tifo génère des affiches au format carré (Instagram 1:1), story verticale (9:16 pour Instagram et TikTok), format paysage (16:9 pour YouTube/Twitter), et bannière de couverture Facebook. Pendant la bêta, les formats standard sont disponibles pour tous.',
  },
  {
    q: 'Faut-il être graphiste pour utiliser Tifo ?',
    a: 'Absolument pas. Tifo est conçu pour que n\'importe qui puisse générer une affiche de qualité professionnelle en quelques clics. Vous renseignez les infos du match, Tifo s\'occupe du design. Aucune compétence en graphisme requise.',
  },
  {
    q: 'Ça marche pour les clubs amateurs ?',
    a: 'C\'est précisément pour ça que Tifo a été créé. Les clubs amateurs n\'ont pas de service communication. Avec Tifo, même un club de district peut communiquer avec des visuels pros sur Facebook, Instagram ou WhatsApp avant chaque match.',
  },
  {
    q: 'Puis-je personnaliser avec les couleurs de mon club ?',
    a: 'Oui. Lors de la création d\'une affiche, vous pouvez renseigner les couleurs primaires de chaque équipe. Tifo les intègre dans la composition visuelle de l\'affiche pour respecter l\'identité de votre club.',
  },
  {
    q: 'Quels types de matchs et compétitions sont supportés ?',
    a: 'Tifo supporte tous types de matchs : Ligue 1, Ligue 2, Championnat National, championnats régionaux, Coupe de France, compétitions européennes, matchs amicaux, tournois... Si vous pouvez le décrire, Tifo peut générer l\'affiche.',
  },
  {
    q: 'Combien de temps faut-il pour générer une affiche ?',
    a: 'En général, moins de 10 secondes. Vous renseignez les informations du match, vous cliquez sur "Générer", et quelques secondes plus tard votre affiche est prête à télécharger.',
  },
  {
    q: 'Les prix affichés sont-ils définitifs ?',
    a: 'Non. Les tarifs affichés sont des prix de lancement réservés aux 100 premiers clients Pro et aux 50 premiers clubs. Plus vous rejoignez Tifo tôt, plus vous verrouillez un tarif avantageux.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative z-10 py-24 md:py-32" id="faq">
      <div className="mx-auto max-w-3xl px-6 md:px-12">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-green-600" />
            <span className="font-body text-xs font-bold uppercase tracking-[0.3em] text-green-600">FAQ</span>
            <div className="h-px w-8 bg-green-600" />
          </div>
          <h2
            className="font-display uppercase text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.01em' }}
          >
            Questions{' '}
            <span className="text-gradient-green">fréquentes.</span>
          </h2>
        </div>

        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <button
                aria-expanded={open === i}
                className="flex w-full items-start justify-between gap-4 py-5 text-left"
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-body text-sm font-bold text-white md:text-base">{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-green-500 transition-transform duration-300"
                  style={{ transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 20 20">
                    <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <p className="pb-5 font-body text-sm leading-relaxed text-slate-400">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
