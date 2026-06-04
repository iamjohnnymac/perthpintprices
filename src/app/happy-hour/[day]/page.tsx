import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Clock, GlassWater } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import { HAPPY_HOUR_DAYS, getHappyHourDayBySlug, pubHasHappyHourOnDay } from '@/lib/happyHourDays'
import { formatHappyHourDays } from '@/lib/happyHourLive'
import { getPubs } from '@/lib/supabase'
import { BASE_URL, pubUrl } from '@/lib/urls'
import type { Pub } from '@/types/pub'

type DayPageProps = {
  params: { day: string }
}

export const revalidate = 3600

export function generateStaticParams() {
  return HAPPY_HOUR_DAYS.map(day => ({ day: day.slug }))
}

export function generateMetadata({ params }: DayPageProps): Metadata {
  const day = getHappyHourDayBySlug(params.day)
  if (!day) return {}
  const canonical = `${BASE_URL}/happy-hour/${day.slug}`
  const description = `${day.label} happy hours in Perth, sorted by checked happy-hour deals with venues, suburbs, windows, and useful links.`

  return {
    title: `${day.label} Happy Hours Perth`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${day.label} Happy Hours Perth | Perth Pint Prices`,
      description,
      url: canonical,
      type: 'website',
      siteName: 'Perth Pint Prices',
      locale: 'en_AU',
      images: [{ url: `${BASE_URL}/articles/perth-happy-hours-by-day-01-5pm-window.png`, width: 1200, height: 630, alt: `${day.label} happy hours in Perth` }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'TBC'
  return Number.isInteger(price) ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}

function formatTime(value: string | null): string {
  if (!value) return ''
  const [hourValue, minuteValue = '0'] = value.split(':')
  const hour = Number(hourValue)
  const minute = Number(minuteValue)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return minute > 0 ? `${hour12}:${String(minute).padStart(2, '0')}${period}` : `${hour12}${period}`
}

function formatWindow(pub: Pub): string {
  if (pub.happyHourStart && pub.happyHourEnd) {
    return `${formatTime(pub.happyHourStart)}-${formatTime(pub.happyHourEnd)}`
  }
  return formatHappyHourDays(pub.happyHourDays) || pub.happyHour || 'Window TBC'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'date TBC'
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' })
}

function buildItemList(rows: Pub[], dayLabel: string) {
  const pricedRows = rows.filter(pub => pub.happyHourPrice !== null)

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${dayLabel} happy hours in Perth`,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: pricedRows.length,
    itemListElement: pricedRows.slice(0, 20).map((pub, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}${pubUrl(pub)}`,
      name: `${pub.name} - ${formatPrice(pub.happyHourPrice)} happy hour`,
    })),
  }
}

export default async function HappyHourDayPage({ params }: DayPageProps) {
  const day = getHappyHourDayBySlug(params.day)
  if (!day) notFound()

  const pubs = await getPubs()
  const dayPubs = pubs
    .filter(pub => pubHasHappyHourOnDay(pub.happyHourDays, day.index))
    .sort((a, b) => (a.happyHourPrice ?? 999) - (b.happyHourPrice ?? 999))
  const pricedRows = dayPubs.filter(pub => pub.happyHourPrice !== null)
  const cheapest = pricedRows[0] ?? null
  const confirmedDiscounts = pricedRows.length
  const canonical = `${BASE_URL}/happy-hour/${day.slug}`

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildItemList(dayPubs, day.label)).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: 'Happy Hour', url: `${BASE_URL}/happy-hour` },
        { name: day.label, url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'Happy Hour', href: '/happy-hour' }, { label: day.label }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <div className="grid gap-6 sm:grid-cols-[1fr_260px] sm:items-end">
          <div>
            <p className="mb-3 type-eyebrow">Day guide</p>
            <h1 className="type-hero-editorial">
              {day.label} happy hours in Perth
            </h1>
            <p className="mt-5 max-w-[620px] font-body text-[0.96rem] leading-relaxed text-gray-mid">
              {cheapest ? <>{day.label} has {dayPubs.length} happy-hour {dayPubs.length === 1 ? 'row' : 'rows'} in the current dataset, with the cheapest confirmed discount at <span className="font-mono font-bold text-ink">{formatPrice(cheapest.happyHourPrice)}</span> from {cheapest.name} in {cheapest.suburb}. Start with the rows, then check the window before anyone calls it a plan.</> : <>We have {dayPubs.length} scheduled {day.label} happy-hour {dayPubs.length === 1 ? 'row' : 'rows'}, but no confirmed discount price for the day yet. The live board still shows what is running right now.</>}
            </p>
          </div>
          <div className="overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <Image
              src="/articles/perth-happy-hours-by-day-01-5pm-window.png"
              alt={`${day.label} happy-hour pint in Perth`}
              width={700}
              height={700}
              className="aspect-square w-full object-cover"
              priority
            />
          </div>
        </div>

        <section className="my-8 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm">
          <p className="type-eyebrow text-white/55">Answer first</p>
          <h2 className="mt-2 type-section text-white">What is the best {day.label} happy hour in Perth?</h2>
          <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
            {cheapest ? <>The cheapest checked {day.label} happy-hour discount is {formatPrice(cheapest.happyHourPrice)} at <Link href={pubUrl(cheapest)} className="font-bold text-amber-light hover:underline">{cheapest.name}</Link> in {cheapest.suburb}. The listed window is {formatWindow(cheapest)}, and the row was last checked {formatDate(cheapest.lastVerified ?? cheapest.priceVerifiedAt)}. Treat that as the starting point, not a promise carved into the bar top.</> : <>Use the live happy-hour board for now; this day needs more confirmed discount prices before it deserves a winner.</>}
          </p>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Rows for {day.label}</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{dayPubs.length}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Pubs with {day.label} in the happy-hour schedule.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Priced discounts</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{confirmedDiscounts}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Rows with a specific happy-hour price attached.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Cheapest listed</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatPrice(cheapest?.happyHourPrice)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{cheapest ? `${cheapest.name}, ${cheapest.suburb}` : 'Needs a checked row.'}</p>
          </div>
        </section>

        <section className="rounded-card border-3 border-ink bg-white shadow-hard-sm">
          <div className="flex items-center justify-between gap-4 border-b-3 border-ink bg-off-white px-5 py-4">
            <div>
              <p className="type-eyebrow">Sorted by price</p>
              <h2 className="type-section">{day.label} rows</h2>
            </div>
            <Clock className="h-5 w-5 text-amber" />
          </div>
          <div className="divide-y divide-gray-light">
            {dayPubs.length > 0 ? dayPubs.slice(0, 30).map((pub, index) => (
              <Link key={pub.id} href={pubUrl(pub)} className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-5 py-4 no-underline hover:bg-off-white">
                <span className="font-mono text-[0.72rem] font-bold text-gray-mid">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-gray-mid">
                    <span>{pub.suburb}</span>
                    <span>{formatWindow(pub)}</span>
                    <span>Checked {formatDate(pub.lastVerified ?? pub.priceVerifiedAt)}</span>
                  </span>
                </span>
                <span className="font-mono text-lg font-extrabold text-ink">{formatPrice(pub.happyHourPrice)}</span>
              </Link>
            )) : (
              <div className="px-5 py-8">
                <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid">No {day.label} rows yet. Perth has chosen mystery over convenience, briefly.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="mb-3 flex items-center gap-2">
              <GlassWater className="h-4 w-4 text-amber" />
              <h2 className="font-mono text-lg font-extrabold text-ink">Other days</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {HAPPY_HOUR_DAYS.filter(other => other.slug !== day.slug).map(other => (
                <Link key={other.slug} href={`/happy-hour/${other.slug}`} className="rounded-card border border-gray-light px-4 py-3 font-mono text-[0.76rem] font-bold text-ink no-underline hover:border-amber hover:text-amber">
                  {other.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <h2 className="font-mono text-lg font-extrabold text-ink">Quick Q&A</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="type-card">Are these live right now?</h3>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">Not necessarily. This page is the {day.label} planning board. For the current minute, use the live happy-hour page.</p>
              </div>
              <div>
                <h3 className="type-card">Why are some windows vague?</h3>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">Some pubs publish the day but not a neat start and end time. We show the clean window where we have it and leave the fuzzy ones fuzzy.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/happy-hour" className="inline-flex items-center gap-1 rounded-pill border-3 border-ink bg-amber px-5 py-3 font-mono text-[0.78rem] font-bold uppercase text-ink no-underline shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover">
            Live happy hours <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/articles/perth-happy-hours-by-day" className="inline-flex items-center gap-1 rounded-pill border-3 border-ink bg-white px-5 py-3 font-mono text-[0.78rem] font-bold uppercase text-ink no-underline shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover">
            Read the guide <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
