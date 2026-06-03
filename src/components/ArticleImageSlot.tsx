import Image from 'next/image'
import type { Article } from '@/lib/articles'

interface ArticleImageSlotProps {
  article: Article
  size: 'feature' | 'card' | 'rail'
  className?: string
}

const imageFocusBySlug: Record<string, string> = {
  'pints-under-10-perth': '50% 35%',
  'perth-happy-hours-by-day': '58% 42%',
  'proper-pint-schooner-middy-perth': '42% 38%',
}

export default function ArticleImageSlot({ article, size, className = '' }: ArticleImageSlotProps) {
  const isFeature = size === 'feature'
  const sizes = isFeature
    ? '(min-width: 640px) 260px, 100vw'
    : size === 'rail'
      ? '(min-width: 640px) 245px, 100vw'
      : '(min-width: 640px) 390px, 100vw'

  return (
    <div className={`relative overflow-hidden bg-amber-pale ${className}`}>
      <Image
        src={article.image}
        alt={article.imageAlt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        style={{ objectPosition: imageFocusBySlug[article.slug] ?? '50% 40%' }}
      />
      <div className="absolute inset-0 bg-ink/10" aria-hidden="true" />
      <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
        <span className="rounded-pill border-2 border-ink bg-amber px-3 py-1 font-mono text-[0.58rem] font-bold uppercase text-ink shadow-hard-sm">
          {article.category}
        </span>
        <span className="rounded-pill border-2 border-ink bg-white px-3 py-1 font-mono text-[0.58rem] font-bold uppercase text-ink shadow-hard-sm">
          {article.heroStat}
        </span>
      </div>
      {isFeature && (
        <div className="absolute bottom-3 right-3 rounded-pill border-2 border-ink bg-white px-3 py-1 font-mono text-[0.58rem] font-bold uppercase text-ink shadow-hard-sm">
          {article.heroLabel}
        </div>
      )}
    </div>
  )
}
