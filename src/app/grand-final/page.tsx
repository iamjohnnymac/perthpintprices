import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Clock, TrainFront, Tv } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import { getCachedPubs } from '@/lib/cachedPubs'
import {
  GF_ANCHOR_VENUES,
  GF_AREAS,
  GF_CHECKED,
  GF_LIVE_SITES,
  GF_TRANSPORT,
  GF_VENUES,
  type GrandFinalAccess,
} from '@/lib/grandFinal'
import { formatAudPrice } from '@/lib/pintPriceStats'
import { BASE_URL, pubUrl } from '@/lib/urls'

const canonical = `${BASE_URL}/grand-final`
const description = 'Perth pubs showing the 2026 AFL Grand Final, Fremantle v Brisbane, with what each venue is offering, the source and the date we checked. First bounce 12:30pm Perth time.'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Where to Watch the 2026 AFL Grand Final in Perth',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'Where to Watch the 2026 AFL Grand Final in Perth | Perth Pint Prices',
    description,
    url: canonical,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Perth Pint Prices Grand Final guide' }],
  },
  twitter: { card: 'summary_large_image' },
}

const FAQ_ITEMS = [
  {
    question: 'What time is the 2026 AFL Grand Final in Perth?',
    answer: 'First bounce is 12:30pm AWST on Saturday 26 September 2026 (2:30pm AEST at the MCG). Pre-game entertainment starts about an hour earlier.',
  },
  {
    question: 'What channel is the Grand Final on in Perth?',
    answer: 'Channel 7, with a free stream on 7plus.',
  },
]

const ACCESS_STYLES: Record<GrandFinalAccess, string> = {
  'Free entry': 'bg-green-pale text-green',
  'Bookings recommended': 'bg-amber-pale text-amber-deep',
  Ticketed: 'bg-amber-pale text-amber-deep',
  'Sold out': 'bg-red-pale text-red-deep',
  'Check with venue': 'bg-gray-light text-gray-mid',
}

function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth',
  })
}

function SourceLink({ url, label, date }: { url: string; label: string; date: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1 font-mono text-[0.66rem] font-bold uppercase tracking-[0.05em] text-amber-deep no-underline hover:underline"
    >
      Source: {label}{date ? ` · ${formatDate(date)}` : ''}
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    </a>
  )
}

function AccessChip({ access }: { access: GrandFinalAccess }) {
  return (
    <span className={`inline-block rounded-pill px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.05em] ${ACCESS_STYLES[access]}`}>
      {access}
    </span>
  )
}

export default async function GrandFinalPage() {
  const pubs = await getCachedPubs()
  const bySlug = new Map(pubs.map(pub => [pub.slug, pub]))

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd()).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: 'Where to watch the 2026 AFL Grand Final in Perth', url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'Grand Final' }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <p className="mb-3 type-eyebrow">AFL Grand Final · Saturday 26 September 2026</p>
        <h1 className="type-hero-editorial">Where to watch the Grand Final in Perth</h1>
        <p className="mt-5 max-w-[640px] font-body text-[0.98rem] leading-relaxed text-gray-mid">
          Fremantle play Brisbane at the MCG with the first bounce at 12:30pm Perth time. Freo are
          chasing their first premiership, so the rooms with a decent screen will fill well before the
          anthem. These are the Perth venues we found advertising the game, each with its source and
          the date we checked it. Plans change on the day, so ring ahead before you move the whole crew.
        </p>

        <div className="my-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm">
            <Clock className="mb-2 h-4 w-4 text-amber-deep" aria-hidden="true" />
            <p className="type-eyebrow">First bounce</p>
            <p className="mt-1 font-mono text-[1.1rem] font-extrabold text-ink">12:30pm AWST</p>
            <p className="mt-1 font-body text-[0.82rem] text-gray-mid">Pre-game from about 11:25am</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm">
            <Tv className="mb-2 h-4 w-4 text-amber-deep" aria-hidden="true" />
            <p className="type-eyebrow">On TV</p>
            <p className="mt-1 font-mono text-[1.1rem] font-extrabold text-ink">Channel 7</p>
            <p className="mt-1 font-body text-[0.82rem] text-gray-mid">Free stream on 7plus</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm">
            <TrainFront className="mb-2 h-4 w-4 text-amber-deep" aria-hidden="true" />
            <p className="type-eyebrow">Getting there</p>
            <p className="mt-1 font-mono text-[1.1rem] font-extrabold text-ink">Transperth is free</p>
            <p className="mt-1 font-body text-[0.82rem] text-gray-mid">{GF_TRANSPORT.note}</p>
            <SourceLink url={GF_TRANSPORT.sourceUrl} label={GF_TRANSPORT.sourceLabel} date={GF_TRANSPORT.sourceDate} />
          </div>
        </div>

        {GF_LIVE_SITES.length > 0 && (
          <section className="mb-10" aria-labelledby="gf-live-sites">
            <h2 id="gf-live-sites" className="type-section mb-4">Free public screens</h2>
            <ul className="grid gap-3">
              {GF_LIVE_SITES.map(site => (
                <li key={site.name} className="rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="type-card">{site.name}</p>
                    <AccessChip access={site.access} />
                  </div>
                  <p className="mt-0.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-gray-mid">{site.location}</p>
                  <p className="mt-2 font-body text-[0.9rem] leading-relaxed text-ink">{site.offer}</p>
                  <SourceLink url={site.sourceUrl} label={site.sourceLabel} date={site.sourceDate} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="gf-venues">
          <h2 id="gf-venues" className="type-section">Pubs showing the game</h2>
          <p className="mb-6 mt-2 max-w-[640px] font-body text-[0.9rem] leading-relaxed text-gray-mid">
            {GF_VENUES.length} venues, checked {formatDate(GF_CHECKED)}. Where we track the pub, the name links
            to its page and shows our last verified pint price. {GF_ANCHOR_VENUES.note}
          </p>
          <div className="-mt-4 mb-6">
            <SourceLink url={GF_ANCHOR_VENUES.sourceUrl} label={`${GF_ANCHOR_VENUES.sourceLabel} away-game pubs`} date={GF_ANCHOR_VENUES.sourceDate} />
          </div>
          {GF_AREAS.map(area => {
            const venues = GF_VENUES.filter(venue => venue.area === area)
            if (venues.length === 0) return null
            return (
              <div key={area} className="mb-8">
                <h3 className="type-eyebrow mb-3">{area}</h3>
                <ul className="grid gap-3">
                  {venues.map(venue => {
                    const pub = venue.slug ? bySlug.get(venue.slug) : undefined
                    const verifiedPrice = pub?.priceVerified && pub.regularPrice !== null ? pub.regularPrice : null
                    return (
                      <li key={`${venue.name}-${venue.suburb}`} className="rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            {pub ? (
                              <Link href={pubUrl(pub)} className="type-card text-ink no-underline hover:underline">
                                {venue.name}
                              </Link>
                            ) : (
                              <p className="type-card">{venue.name}</p>
                            )}
                            <p className="mt-0.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-gray-mid">
                              {venue.suburb}
                              {verifiedPrice !== null && <span className="text-ink"> · Pint {formatAudPrice(verifiedPrice)}</span>}
                            </p>
                          </div>
                          <AccessChip access={venue.access} />
                        </div>
                        <p className="mt-2 font-body text-[0.9rem] leading-relaxed text-ink">{venue.offer}</p>
                        <SourceLink url={venue.sourceUrl} label={venue.sourceLabel} date={venue.sourceDate} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </section>

        <section className="mt-10" aria-labelledby="gf-faq">
          <h2 id="gf-faq" className="type-section mb-4">Quick answers</h2>
          <dl className="grid gap-4">
            {FAQ_ITEMS.map(item => (
              <div key={item.question}>
                <dt className="font-mono text-[0.86rem] font-bold text-ink">{item.question}</dt>
                <dd className="mt-1 font-body text-[0.9rem] leading-relaxed text-gray-mid">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </section>

      <Footer />
    </main>
  )
}
