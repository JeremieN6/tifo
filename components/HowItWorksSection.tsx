const steps = [
  {
    number: '01',
    title: 'Renseigne le match',
    description: 'Équipes, date, lieu et style en quelques champs. Simple et rapide.',
  },
  {
    number: '02',
    title: 'L\'IA génère ton affiche',
    description: 'GPT-image-1 crée une affiche professionnelle et unique en quelques secondes.',
  },
  {
    number: '03',
    title: 'Télécharge et partage',
    description: 'Récupère ton affiche en HD et partage-la sur tes réseaux, pour le match.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight text-white">
            Comment ça marche
          </h2>
          <p className="mt-4 text-gray-400">De zéro à une affiche professionnelle en 3 étapes</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-xl border border-green-900/30 bg-green-950/10 p-8 hover:border-green-500/30 transition-colors"
            >
              <div className="font-display text-6xl text-green-500/30 leading-none">{step.number}</div>
              <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
