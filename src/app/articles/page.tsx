import type { Metadata } from 'next'
import { ArrowUpRight, BookOpen, CalendarDays } from 'lucide-react'
import ArticleImageSlot from '@/components/ArticleImageSlot'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import TrackedLink from '@/components/TrackedLink'
import { articleUrl, articles, formatArticleDate } from '@/lib/articles'

const canonical = 'https://perthpintprices.com/articles'
const description = 'Pub and drinking stories from Perth Pint Prices: cheap pints, happy hours, glass sizes, suburb notes, and the data behind a night out.'

export const metadata: Metadata = {
  title: 'Perth Pub Articles & Drinking Guides',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'Perth Pub Articles & Drinking Guides | Perth Pint Prices',
    description,
    url: canonical,
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    type: 'website',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Pint Prices articles' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function ArticlesPage() {
  const [featured, ...rest] = articles
  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Articles', url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'Articles' }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <div className="mb-10">
          <p className="font-mono text-[0.68rem] font-bold uppercase text-gray-mid mb-3">
            Pub notes
          </p>
          <h1 className="max-w-[700px] font-display text-[3rem] leading-[1] text-ink sm:text-[4.8rem]">
            Perth drinking, with the prices left in.
          </h1>
          <p className="font-body text-[0.95rem] leading-relaxed text-gray-mid mt-5 max-w-[590px]">
            Stories, explainers, and pub guides from the price side of the bar. No &quot;hidden gems&quot;, no smoke machine, just useful local notes with a number attached where we have one.
          </p>
        </div>

        {featured && (
          <TrackedLink
            href={articleUrl(featured.slug)}
            eventName="article_click"
            eventProperties={{
              source: 'articles_hub_featured',
              slug: featured.slug,
              category: featured.category,
              position: 1,
            }}
            className="group block no-underline mb-10"
          >
            <article className="overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm transition-all group-hover:translate-x-[1.5px] group-hover:translate-y-[1.5px] group-hover:shadow-hard-hover">
              <div className="grid sm:grid-cols-[1fr_260px]">
                <div className="bg-ink p-6 text-white sm:p-8">
                  <div className="mb-12 flex flex-wrap items-center gap-2 sm:mb-16">
                    <span className="inline-flex items-center rounded-pill border border-white/25 bg-amber px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-ink">
                      Featured guide
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-pill border border-white/20 bg-white/10 px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-white/80">
                      <CalendarDays className="h-3 w-3" />
                      {formatArticleDate(featured.publishedAt)}
                    </span>
                  </div>
                  <p className="mb-3 font-mono text-[0.68rem] font-bold uppercase text-white/60">{featured.category}</p>
                  <h2 className="font-display text-[2.4rem] leading-[1] text-white sm:text-[3.6rem]">
                    {featured.title}
                  </h2>
                  <p className="mt-4 max-w-[530px] font-body text-[0.95rem] leading-relaxed text-white/75">
                    {featured.deck}
                  </p>
                </div>
                <div className="flex flex-col border-t-3 border-ink bg-amber sm:border-l-3 sm:border-t-0">
                  <ArticleImageSlot
                    article={featured}
                    size="feature"
                    className="aspect-[16/10] border-b-3 border-ink sm:aspect-auto sm:min-h-[210px]"
                  />
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <p className="font-mono text-[0.68rem] font-bold uppercase text-ink/70">{featured.heroLabel}</p>
                      <p className="mt-3 font-mono text-[2.45rem] font-extrabold leading-none text-ink">{featured.heroStat}</p>
                      <p className="mt-2 font-body text-[0.82rem] font-bold leading-snug text-ink/70">{featured.heroSubstat}</p>
                    </div>
                    <span className="mt-8 inline-flex items-center gap-1 font-mono text-[0.72rem] font-bold uppercase text-ink">
                      Read guide <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </TrackedLink>
        )}

        <section>
          <div className="mb-5 flex items-center justify-between gap-4 border-b-3 border-ink pb-3">
            <h2 className="font-mono text-xl font-extrabold text-ink">Latest notes</h2>
            <BookOpen className="h-5 w-5 text-gray-mid" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.map((article, index) => (
              <TrackedLink
                key={article.slug}
                href={articleUrl(article.slug)}
                eventName="article_click"
                eventProperties={{
                  source: 'articles_hub_latest',
                  slug: article.slug,
                  category: article.category,
                  position: index + 2,
                }}
                className="group flex min-h-[390px] flex-col overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm transition-all hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover no-underline"
              >
                <ArticleImageSlot article={article} size="card" className="aspect-[16/9] border-b-3 border-ink" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-end gap-4">
                    <span className="font-mono text-[0.65rem] font-bold uppercase text-gray-mid">
                      {formatArticleDate(article.publishedAt)} - {article.readingMinutes} min
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[2rem] leading-[1.05] text-ink group-hover:text-amber sm:text-[2.25rem]">
                    {article.title}
                  </h3>
                  <p className="mt-4 flex-1 font-body text-[0.92rem] leading-relaxed text-gray-mid">
                    {article.deck}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 font-mono text-[0.72rem] font-bold uppercase text-amber">
                    Read it <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </TrackedLink>
            ))}
          </div>
        </section>

      </section>

      <Footer />
    </main>
  )
}
