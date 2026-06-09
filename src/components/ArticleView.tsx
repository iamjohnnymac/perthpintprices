import Image from 'next/image'
import { ArrowUpRight, Beer, CalendarDays, Clock, GlassWater } from 'lucide-react'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import TrackedLink from '@/components/TrackedLink'
import { articleUrl, formatArticleDate, type Article, type ArticleInlineImage } from '@/lib/articles'
import { formatHappyHourDays } from '@/lib/happyHourLive'
import { pubUrl } from '@/lib/urls'
import type { Pub } from '@/types/pub'

// The visual body of an article — shared by the live /articles/[slug] route and
// the dev-only /draft/[slug] preview, so a draft renders exactly like a published
// article. SEO (JSON-LD, breadcrumb schema, canonical) stays on the live route;
// this component is presentation only.

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' })
}

function formatPrice(price: number | null | undefined): string {
  return price == null ? 'TBC' : `$${price.toFixed(2)}`
}

function relatedLinkTracking(link: { href: string; label: string }) {
  if (link.href === '/?submit=1') {
    return {
      eventName: 'report_price_click',
      eventProperties: {
        target_path: link.href,
        target_label: link.label,
      },
    }
  }

  const pathParts = link.href.split('?')[0].split('/').filter(Boolean)
  const isPubDetailPath = pathParts.length === 2 && !['articles', 'guides', 'insights'].includes(pathParts[0])

  if (isPubDetailPath) {
    return {
      eventName: 'article_pub_click',
      eventProperties: {
        source: 'article_related_links',
        target_path: link.href,
        target_label: link.label,
        suburb_slug: pathParts[0],
        pub_slug: pathParts[1],
      },
    }
  }

  return {
    eventName: 'article_internal_click',
    eventProperties: {
      target_path: link.href,
      target_label: link.label,
    },
  }
}

function ArticleFigure({ image, priority = false }: { image: ArticleInlineImage; priority?: boolean }) {
  return (
    <figure className="my-5 overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
      <Image
        src={image.src}
        alt={image.alt}
        width={1672}
        height={941}
        sizes="(min-width: 800px) 800px, 100vw"
        priority={priority}
        className="h-auto w-full"
      />
      <figcaption className="border-t-3 border-ink bg-off-white px-4 py-3 font-body text-[0.76rem] leading-relaxed text-gray-mid">
        {image.caption}
      </figcaption>
    </figure>
  )
}

function parseHappyHourDayIndexes(days: string | null): number[] {
  if (!days) return []
  const dayMap: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
  }
  const clean = days.replace(/[{}]/g, '').toLowerCase().trim()
  if (['7 days', 'daily', 'everyday', 'every day'].includes(clean)) return [0, 1, 2, 3, 4, 5, 6]
  const parts = clean.split(',').map(part => part.trim()).filter(Boolean)
  return parts
    .map(part => dayMap[part] ?? dayMap[part.slice(0, 3)])
    .filter((value): value is number => value !== undefined)
}

function Under10Module({ pubs, articleSlug }: { pubs: Pub[]; articleSlug: string }) {
  const under10 = pubs
    .filter(pub => pub.priceVerified && pub.regularPrice !== null && pub.regularPrice < 10)
    .sort((a, b) => (a.regularPrice ?? 99) - (b.regularPrice ?? 99))
    .slice(0, 8)

  if (under10.length === 0) {
    return (
      <div className="rounded-card border-3 border-ink bg-amber-pale p-5 shadow-hard-sm">
        <h2 className="font-mono text-lg font-extrabold text-ink">No verified sub-$10 pints right now</h2>
        <p className="mt-2 font-body text-[0.86rem] leading-relaxed text-gray-mid">
          Either Perth has become briefly sensible with its data, or the cheap rows need checking again.
        </p>
      </div>
    )
  }

  return (
    <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="type-eyebrow">Live rows</p>
          <h2 className="type-section">Verified under $10</h2>
        </div>
        <Beer className="h-5 w-5 text-amber" />
      </div>
      <div className="divide-y divide-gray-light">
        {under10.map((pub, index) => (
          <TrackedLink
            key={pub.id}
            href={pubUrl(pub)}
            eventName="article_pub_click"
            eventProperties={{
              source: 'article_under10_module',
              article_slug: articleSlug,
              pub_slug: pub.slug,
              suburb: pub.suburb,
              position: index + 1,
              price: pub.regularPrice,
            }}
            className="group flex items-center justify-between gap-4 py-3 no-underline"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</p>
              <p className="text-[0.68rem] text-gray-mid">
                {pub.suburb}{pub.lastVerified ? ` - checked ${formatDate(pub.lastVerified)}` : ''}
              </p>
            </div>
            <span className="font-mono text-lg font-extrabold text-ink">{formatPrice(pub.regularPrice)}</span>
          </TrackedLink>
        ))}
      </div>
    </section>
  )
}

function HappyHoursByDayModule({ pubs, articleSlug }: { pubs: Pub[]; articleSlug: string }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const rows = days.map((day, index) => {
    // Only genuine, confirmed drops: a verified regular pint price AND a lower
    // happy-hour price. Excludes small-pour specials with no confirmed pint
    // price and "windows" where the price doesn't actually drop.
    const dayPubs = pubs
      .filter(pub =>
        parseHappyHourDayIndexes(pub.happyHourDays).includes(index) &&
        pub.happyHourPrice !== null &&
        pub.priceVerified &&
        pub.regularPrice !== null &&
        pub.happyHourPrice < pub.regularPrice,
      )
      .sort((a, b) => (a.happyHourPrice ?? 99) - (b.happyHourPrice ?? 99))
    return { day, pubs: dayPubs, cheapest: dayPubs[0] ?? null }
  })

  return (
    <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="type-eyebrow">Planning board</p>
          <h2 className="type-section">Happy hours by day</h2>
        </div>
        <Clock className="h-5 w-5 text-amber" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(row => (
          <div key={row.day} className="rounded-card border border-gray-light bg-off-white p-4">
            <p className="font-mono text-[0.8rem] font-extrabold text-ink">{row.day}</p>
            {row.cheapest ? (
              <>
                <TrackedLink
                  href={pubUrl(row.cheapest)}
                  eventName="article_pub_click"
                  eventProperties={{
                    source: 'article_happy_hour_day_module',
                    article_slug: articleSlug,
                    pub_slug: row.cheapest.slug,
                    suburb: row.cheapest.suburb,
                    day: row.day,
                    price: row.cheapest.happyHourPrice,
                  }}
                  className="mt-2 block font-mono text-[0.82rem] font-bold text-amber hover:underline"
                >
                  {row.cheapest.name}
                </TrackedLink>
                <p className="mt-1 text-[0.68rem] text-gray-mid">
                  {formatPrice(row.cheapest.happyHourPrice)} - {formatHappyHourDays(row.cheapest.happyHourDays)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[0.76rem] text-gray-mid">No clean day-specific row yet.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function GlassSizesModule() {
  return (
    <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="type-eyebrow">Reference</p>
          <h2 className="type-section">Glass sizes we care about</h2>
        </div>
        <GlassWater className="h-5 w-5 text-amber" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { name: 'Middy', size: '285ml', note: 'Small, useful, rarely the comparison point.' },
          { name: 'Schooner', size: '425ml', note: 'Common enough to cause price confusion.' },
          { name: 'Pint', size: '570ml', note: 'The PPP benchmark where we can verify it.' },
        ].map(size => (
          <div key={size.name} className="rounded-card border-2 border-ink bg-amber-pale p-4">
            <p className="font-mono text-[0.72rem] font-bold uppercase text-gray-mid">{size.name}</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-ink">{size.size}</p>
            <p className="mt-2 text-[0.74rem] leading-relaxed text-gray-mid">{size.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ArticleLiveModule({ module, pubs, articleSlug }: { module: string; pubs: Pub[]; articleSlug: string }) {
  if (module === 'under10') return <Under10Module pubs={pubs} articleSlug={articleSlug} />
  if (module === 'happyHoursByDay') return <HappyHoursByDayModule pubs={pubs} articleSlug={articleSlug} />
  return <GlassSizesModule />
}

export function ArticleView({ article, pubs }: { article: Article; pubs: Pub[] }) {
  const sectionImages = new Map(article.supportingImages.map(image => [image.sectionHeading, image]))

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav breadcrumbs={[{ label: 'Articles', href: '/articles' }, { label: article.category }]} />

      <article className="max-w-container mx-auto px-6 pt-8 pb-12">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-pill border-2 border-ink bg-amber-pale px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-ink">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-pill border border-gray-light bg-white px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-gray-mid">
              <CalendarDays className="h-3 w-3" />
              {formatArticleDate(article.publishedAt)}
            </span>
            <span className="rounded-pill border border-gray-light bg-white px-3 py-1 font-mono text-[0.62rem] font-bold uppercase text-gray-mid">
              {article.readingMinutes} min
            </span>
          </div>
          <h1 className="type-hero-editorial">
            {article.title}
          </h1>
          <p className="mt-5 max-w-[660px] font-body text-[1rem] leading-relaxed text-gray-mid">
            {article.deck}
          </p>
        </header>

        <ArticleFigure
          priority
          image={{
            src: article.image,
            alt: article.imageAlt,
            caption: article.heroSubstat,
            sectionHeading: article.title,
          }}
        />

        <div className="space-y-7">
          {article.sections.map(section => {
            const inlineImage = sectionImages.get(section.heading)
            return (
              <section key={section.heading}>
                <h2 className="type-section">{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map(paragraph => (
                    <p key={paragraph} className="font-body text-[0.92rem] leading-relaxed text-gray-mid">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {inlineImage && <ArticleFigure image={inlineImage} />}
              </section>
            )
          })}

          <ArticleLiveModule module={article.liveModule} pubs={pubs} articleSlug={article.slug} />

          <section className="rounded-card border-3 border-ink bg-ink p-5 shadow-hard-sm">
            <h2 className="font-mono text-lg font-extrabold text-white">Keep going</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {article.relatedLinks.map((link, index) => {
                const tracking = relatedLinkTracking(link)
                return (
                  <TrackedLink
                    key={link.href}
                    href={link.href}
                    eventName={tracking.eventName}
                    eventProperties={{
                      source: 'article_related_links',
                      article_slug: article.slug,
                      position: index + 1,
                      ...tracking.eventProperties,
                    }}
                    className="flex min-h-[88px] flex-col justify-between rounded-card border border-white/15 bg-white/5 p-4 no-underline transition-colors hover:bg-white/10"
                  >
                    <span className="font-mono text-[0.8rem] font-bold leading-tight text-white">{link.label}</span>
                    <ArrowUpRight className="mt-3 h-4 w-4 text-amber-light" />
                  </TrackedLink>
                )
              })}
            </div>
          </section>

          <div className="pt-2">
            <TrackedLink
              href={articleUrl(article.slug) === '/articles/pints-under-10-perth' ? '/?submit=1' : '/articles'}
              eventName={articleUrl(article.slug) === '/articles/pints-under-10-perth' ? 'report_price_click' : 'article_hub_click'}
              eventProperties={{
                source: 'article_detail_bottom_cta',
                article_slug: article.slug,
              }}
              className="font-mono text-[0.75rem] font-bold uppercase text-amber hover:underline"
            >
              {articleUrl(article.slug) === '/articles/pints-under-10-perth' ? 'Know a cheaper pint? Report it' : 'Back to articles'}
            </TrackedLink>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
