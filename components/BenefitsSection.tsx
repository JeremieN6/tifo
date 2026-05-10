const benefits = [
  {
    icon: '⚡',
    title: 'Ultra rapide',
    description: 'Affiche générée en moins de 30 secondes grâce à GPT-image-1.',
  },
  {
    icon: '🎨',
    title: 'Design professionnel',
    description: 'Styles Moderne, Vintage, Ultra et Minimaliste au choix.',
  },
  {
    icon: '🏟️',
    title: 'Personnalisation totale',
    description: 'Équipes, couleurs, stade, image de référence — tout est paramétrable.',
  },
  {
    icon: '📱',
    title: 'Prêt pour les réseaux',
    description: 'Format portrait optimisé pour Instagram, Twitter et WhatsApp.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-green-950/10 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight text-white">
            Pourquoi Tifo ?
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-green-900/20 bg-[#020f07] p-6">
              <div className="text-3xl">{b.icon}</div>
              <h3 className="mt-3 font-semibold text-white">{b.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
