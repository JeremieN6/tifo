import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';
import { getPublishedBlogArticleBySlug } from '@/lib/blog';
import { canonicalUrl } from '@/lib/seo';

export const revalidate = 300;

type ArticlePageProps = {
  params: {
    slug: string;
  };
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

function renderMarkdownBlocks(markdown: string): JSX.Element[] {
  const blocks = markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const elements: JSX.Element[] = [];

  blocks.forEach((block, index) => {
    if (block.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="mt-8 font-body text-xl font-semibold text-white">
          {block.replace(/^###\s+/, '')}
        </h3>
      );
      return;
    }

    if (block.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="mt-10 font-body text-2xl font-semibold text-white">
          {block.replace(/^##\s+/, '')}
        </h2>
      );
      return;
    }

    if (block.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="mt-10 font-body text-3xl font-bold text-white">
          {block.replace(/^#\s+/, '')}
        </h1>
      );
      return;
    }

    if (block.includes('\n- ')) {
      const items = block
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace(/^-\s+/, ''));

      if (items.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="mt-6 list-disc space-y-2 pl-5 font-body text-base leading-relaxed text-slate-200">
            {items.map((item) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        );
        return;
      }
    }

    elements.push(
      <p key={`p-${index}`} className="mt-6 font-body text-base leading-relaxed text-slate-200">
        {block}
      </p>
    );
  });

  return elements;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getPublishedBlogArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Article introuvable | Blog Tifo',
    };
  }

  return {
    title: `${article.title} | Blog Tifo`,
    description: article.meta_description,
    alternates: {
      canonical: canonicalUrl(`/blog/${article.slug}`),
    },
    openGraph: {
      title: article.title,
      description: article.meta_description,
      type: 'article',
      publishedTime: article.published_at ?? article.created_at,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getPublishedBlogArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#020f07] text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-28 md:px-10">
        <Link href="/blog" className="font-body text-xs uppercase tracking-[0.22em] text-green-400 hover:text-green-300">
          Retour au blog
        </Link>

        <article className="mt-5 rounded-2xl border border-green-900/40 bg-black/25 p-7">
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-green-500/80">{article.topic}</p>
          <h1 className="mt-3 font-display text-4xl uppercase tracking-tight text-white sm:text-5xl">{article.title}</h1>
          <p className="mt-4 font-body text-sm text-slate-400">{formatDate(article.published_at ?? article.created_at)}</p>
          <p className="mt-6 border-l-2 border-green-700/70 pl-4 font-body text-base leading-relaxed text-slate-300">{article.excerpt}</p>

          <div className="mt-8 border-t border-green-900/30 pt-2">
            {renderMarkdownBlocks(article.content_markdown)}
          </div>

          {article.faq_json && article.faq_json.length > 0 && (
            <div className="mt-10 border-t border-green-900/30 pt-8">
              <h2 className="font-body text-2xl font-semibold text-white">Foire aux questions</h2>
              <div className="mt-6 space-y-6">
                {article.faq_json.map((item) => (
                  <div key={item.question}>
                    <h3 className="font-body text-lg font-semibold text-white">{item.question}</h3>
                    <p className="mt-2 font-body text-base leading-relaxed text-slate-300">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <FooterSection />

      {article.faq_json && article.faq_json.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: article.faq_json.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  );
}
