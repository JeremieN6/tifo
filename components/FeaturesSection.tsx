const features = [
  { icon: '🤖', title: 'IA de pointe', desc: 'GPT-image-1 d\'OpenAI pour des résultats bluffants.' },
  { icon: '🎭', title: '4 styles graphiques', desc: 'Moderne, Vintage, Ultra, Minimaliste.' },
  { icon: '🔍', title: 'Logo automatique', desc: 'Recherche et intègre le logo de l\'équipe automatiquement.' },
  { icon: '📐', title: 'Format portrait 2:3', desc: 'Optimisé pour les stories et publications réseaux sociaux.' },
  { icon: '🗓️', title: 'Historique complet', desc: 'Retrouve toutes tes affiches dans ton tableau de bord.' },
  { icon: '🔒', title: 'Sécurisé', desc: 'Tes données sont protégées et tes affiches privées.' },
];

export default function FeaturesSection() {
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-5xl uppercase tracking-tight text-white">Fonctionnalités</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-green-900/20 bg-green-950/10 p-6 hover:border-green-500/30 transition-colors">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
