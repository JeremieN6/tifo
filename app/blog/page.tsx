import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';
import { getPublishedBlogArticles } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog Tifo | Conseils marketing et visuels matchday',
  description:
    'Articles pratiques pour clubs amateurs: affiches de match, contenu social multi-format, IA et stratégie de communication sportive.',
};

function formatDate(value: string | null): string {
  if (!value) {
    return 'Date inconnue';
  }

  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPage() {
  const posts = await getPublishedBlogArticles(60);

  return (
    <div className="min-h-screen bg-[#020f07] text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-16 pt-28 md:px-10">
        <header className="mb-12">
          <p className="font-body text-xs uppercase tracking-[0.25em] text-green-500/80">Blog</p>
          <h1 className="mt-3 font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Marketing sportif et contenu matchday
          </h1>
          <p className="mt-4 max-w-3xl font-body text-base leading-relaxed text-slate-300">
            Guides et comparatifs pour aider les clubs amateurs à gagner du temps et publier des visuels plus impactants sur Instagram, X et YouTube.
          </p>
        </header>

        {posts.length === 0 ? (
          <section className="rounded-2xl border border-green-900/40 bg-black/20 p-6">
            <p className="font-body text-sm text-slate-300">Aucun article publié pour le moment.</p>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-green-900/40 bg-black/25 p-6 transition-colors hover:border-green-600/60">
                <p className="font-body text-[11px] uppercase tracking-[0.2em] text-green-500/80">{post.topic}</p>
                <h2 className="mt-3 font-body text-xl font-semibold leading-tight text-white">{post.title}</h2>
                <p className="mt-3 font-body text-sm leading-relaxed text-slate-300">{post.excerpt}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-body text-xs text-slate-500">{formatDate(post.published_at ?? post.created_at)}</span>
                  <Link href={`/blog/${post.slug}`} className="font-body text-xs font-bold uppercase tracking-[0.18em] text-green-400 hover:text-green-300">
                    Lire
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
      <FooterSection />
    </div>
  );
}
