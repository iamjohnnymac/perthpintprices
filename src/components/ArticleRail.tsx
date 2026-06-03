import Link from 'next/link'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import ArticleImageSlot from '@/components/ArticleImageSlot'
import { articleUrl, articles } from '@/lib/articles'

interface ArticleRailProps {
  eyebrow?: string
  title?: string
  intro?: string
  limit?: number
  variant?: 'light' | 'dark'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ArticleRail({
  eyebrow = 'Pub notes',
  title = 'Latest pub notes',
  intro = 'Useful drinking notes with the prices left in.',
  limit = 3,
  variant = 'light',
}: ArticleRailProps) {
  const shownArticles = articles.slice(0, limit)
  const isDark = variant === 'dark'

  return (
    <section className={isDark ? 'bg-ink text-white' : ''}>
      <div className="max-w-container mx-auto px-6 py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className={`mb-2 font-mono text-[0.68rem] font-bold uppercase ${isDark ? 'text-white/45' : 'text-gray-mid'}`}>
              {eyebrow}
            </p>
            <h2 className={`font-mono text-xl font-extrabold ${isDark ? 'text-white' : 'text-ink'}`}>
              {title}
            </h2>
            <p className={`mt-2 max-w-[520px] font-body text-[0.88rem] leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-mid'}`}>
              {intro}
            </p>
          </div>
          <BookOpen className={`hidden h-5 w-5 flex-shrink-0 sm:block ${isDark ? 'text-white/35' : 'text-gray-mid'}`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {shownArticles.map(article => (
            <Link
              key={article.slug}
              href={articleUrl(article.slug)}
              className={`group flex min-h-[380px] flex-col overflow-hidden rounded-card border-3 no-underline shadow-hard-sm transition-all hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover ${
                isDark
                  ? 'border-white/20 bg-white text-ink'
                  : 'border-ink bg-white text-ink'
              }`}
            >
              <ArticleImageSlot article={article} size="rail" className="aspect-[16/10] border-b-3 border-ink" />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.62rem] font-bold uppercase text-gray-mid">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[1.55rem] leading-[1.05] text-ink group-hover:text-amber">
                  {article.title}
                </h3>
                <p className="mt-3 flex-1 font-body text-[0.82rem] leading-relaxed text-gray-mid">
                  {article.deck}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 font-mono text-[0.7rem] font-bold uppercase text-amber">
                  Read it <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/articles"
          className={`mt-5 inline-flex items-center gap-1 font-mono text-[0.72rem] font-bold uppercase no-underline hover:underline ${
            isDark ? 'text-amber-light' : 'text-amber'
          }`}
        >
          All articles <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
