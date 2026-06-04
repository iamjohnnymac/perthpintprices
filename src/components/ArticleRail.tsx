import { ArrowUpRight, BookOpen } from 'lucide-react'
import ArticleImageSlot from '@/components/ArticleImageSlot'
import TrackedLink from '@/components/TrackedLink'
import { articleUrl, articles, formatArticleDate } from '@/lib/articles'

interface ArticleRailProps {
  eyebrow?: string
  title?: string
  intro?: string
  limit?: number
  variant?: 'light' | 'dark'
  source?: string
}

export default function ArticleRail({
  eyebrow = 'Pub notes',
  title = 'Latest pub notes',
  intro = 'Useful drinking notes with the prices left in.',
  limit = 3,
  variant = 'light',
  source = 'article_rail',
}: ArticleRailProps) {
  const shownArticles = articles.slice(0, limit)
  const isDark = variant === 'dark'

  return (
    <section className={isDark ? 'bg-ink text-white' : ''}>
      <div className="max-w-container mx-auto px-6 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className={`type-eyebrow mb-2 ${isDark ? 'text-white/45' : 'text-gray-mid'}`}>
              {eyebrow}
            </p>
            <h2 className={`type-section ${isDark ? 'text-white' : 'text-ink'}`}>
              {title}
            </h2>
            <p className={`mt-2 max-w-[520px] font-body text-[0.88rem] leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-mid'}`}>
              {intro}
            </p>
          </div>
          <BookOpen className={`hidden h-5 w-5 flex-shrink-0 sm:block ${isDark ? 'text-white/35' : 'text-gray-mid'}`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {shownArticles.map((article, index) => (
            <TrackedLink
              key={article.slug}
              href={articleUrl(article.slug)}
              eventName="article_click"
              eventProperties={{
                source,
                slug: article.slug,
                category: article.category,
                position: index + 1,
              }}
              className={`group flex min-h-[380px] flex-col overflow-hidden rounded-card border-3 no-underline shadow-hard-sm transition-all hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover ${
                isDark
                  ? 'border-white/20 bg-white text-ink'
                  : 'border-ink bg-white text-ink'
              }`}
            >
              <ArticleImageSlot article={article} size="rail" className="aspect-[16/10] border-b-3 border-ink" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="type-eyebrow">
                    {formatArticleDate(article.publishedAt)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[1.55rem] leading-[1.05] text-ink group-hover:text-amber">
                  {article.title}
                </h3>
                <p className="mt-3 flex-1 font-body text-[0.82rem] leading-relaxed text-gray-mid">
                  {article.deck}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 type-eyebrow text-amber">
                  Read it <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </TrackedLink>
          ))}
        </div>

        <TrackedLink
          href="/articles"
          eventName="article_hub_click"
          eventProperties={{ source }}
          className={`mt-5 inline-flex items-center gap-1 type-eyebrow no-underline hover:underline ${
            isDark ? 'text-amber-light' : 'text-amber'
          }`}
        >
          All articles <ArrowUpRight className="h-3.5 w-3.5" />
        </TrackedLink>
      </div>
    </section>
  )
}
