'use client';
import { useState } from 'react';

const faqs = [
  {
    q: 'Comment fonctionne la génération d\'affiche ?',
    a: 'Tu renseignes les équipes, la date, le lieu et le style souhaité. Notre IA crée ensuite une affiche unique et professionnelle en quelques secondes.',
  },
  {
    q: 'Puis-je ajouter une image de référence ?',
    a: 'Oui ! Tu peux uploader une image pour inspirer le style graphique de l\'affiche générée.',
  },
  {
    q: 'Qu\'est-ce qui se passe quand mon quota est épuisé ?',
    a: 'Tu peux passer au plan Pro (9€/mois) pour des affiches illimitées, ou attendre le renouvellement mensuel de ton quota Starter.',
  },
  {
    q: 'Les affiches sont-elles en haute définition ?',
    a: 'Oui, les affiches sont générées au format 1024×1536px (portrait). Le plan Pro offre un accès prioritaire à la génération HD.',
  },
  {
    q: 'Comment annuler mon abonnement ?',
    a: 'Tu peux annuler à tout moment depuis ton espace compte. L\'annulation prend effet à la fin de la période en cours.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight text-white">Questions fréquentes</h2>
        </div>

        <div className="divide-y divide-green-900/20">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                className="flex w-full items-center justify-between py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-white">{faq.q}</span>
                <svg
                  className={`h-5 w-5 text-green-500 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="pb-5 text-gray-400 text-sm">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
