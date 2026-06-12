import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Beer, CircleDollarSign, Ruler } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import { formatAudPrice, getPintPriceStats } from '@/lib/pintPriceStats'
import { getCachedPubs } from '@/lib/cachedPubs'
import { BASE_URL, pubUrl } from '@/lib/urls'
import type { Pub } from '@/types/pub'

const canonical = `${BASE_URL}/how-much-is-a-pint-in-perth`
const description = 'How much a pint costs in Perth right now, using verified regular pint prices from Perth Pint Prices with the current average, median, range, and glass-size notes.'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'How Much Is a Pint in Perth?',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'How Much Is a Pint in Perth? | Perth Pint Prices',
    description,
    url: canonical,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: `${BASE_URL}/articles/pints-under-10-perth-01-fremantle-6-pint.png`, width: 1200, height: 630, alt: 'A pint on a Perth pub table' }],
  },
  twitter: { card: 'summary_large_image' },
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'date TBC'
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' })
}

function buildItemList(rows: Pub[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Checked Perth pint prices',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 12).map((pub, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}${pubUrl(pub)}`,
      name: `${pub.name} - ${formatAudPrice(pub.regularPrice)} pint`,
    })),
  }
}

export default async function HowMuchIsAPintInPerthPage() {
  const pubs = await getCachedPubs()
  const stats = getPintPriceStats(pubs)
  const cheapestRows = stats.verifiedPubs.slice(0, 8)
  const cheapest = stats.cheapestPub

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildItemList(cheapestRows)).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: 'How much is a pint in Perth?', url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'Pint cost' }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <div className="grid gap-6 sm:grid-cols-[1fr_250px] sm:items-end">
          <div>
            <p className="mb-3 type-eyebrow">Answer first</p>
            <h1 className="type-hero-editorial">
              How much is a pint in Perth?
            </h1>
            <p className="mt-5 max-w-[640px] font-body text-[0.98rem] leading-relaxed text-gray-mid">
              A pint in Perth costs about <span className="font-mono font-bold text-ink">{formatAudPrice(stats.averagePrice)}</span> on average across {stats.verifiedCount} verified regular pint prices in the current Perth Pint Prices dataset. The median is <span className="font-mono font-bold text-ink">{formatAudPrice(stats.medianPrice)}</span>, and the cheapest checked pint is {cheapest ? <><span className="font-mono font-bold text-ink">{formatAudPrice(cheapest.regularPrice)}</span> at {cheapest.name} in {cheapest.suburb}</> : 'still TBC'}.
            </p>
          </div>
          <div className="overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <Image
              src="/articles/pints-under-10-perth-01-fremantle-6-pint.png"
              alt="A checked Perth pint"
              width={700}
              height={700}
              className="aspect-square w-full object-cover"
              priority
            />
          </div>
        </div>

        <section className="my-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Average pint</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatAudPrice(stats.averagePrice)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Verified regular pint prices only.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Median pint</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatAudPrice(stats.medianPrice)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">The middle of the checked-price pack.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Checked range</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatAudPrice(stats.minPrice)}-{formatAudPrice(stats.maxPrice)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{stats.trackedCount} pubs tracked across {stats.suburbCount} suburbs.</p>
          </div>
        </section>

        <section className="mb-8 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm">
          <div className="flex items-start gap-3">
            <CircleDollarSign className="mt-1 h-5 w-5 shrink-0 text-amber-light" />
            <div>
              <p className="type-eyebrow text-white/55">Short version</p>
              <h2 className="mt-2 type-section text-white">What should you budget for one pint?</h2>
              <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
                Budget roughly {formatAudPrice(stats.averagePrice)} for a standard Perth pint if you are walking into a random checked pub. If you care where the cheap end still lives, start with the live <Link href="/cheapest-pints" className="font-bold text-amber-light hover:underline">cheapest-pints list</Link>; {stats.underTenCount} verified rows currently sit under $10.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-[1fr_0.85fr]">
          <div className="rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <div className="border-b-3 border-ink bg-off-white px-5 py-4">
              <p className="type-eyebrow">Live rows</p>
              <h2 className="mt-1 type-section">Cheapest checked pints right now</h2>
            </div>
            <div className="divide-y divide-gray-light">
              {cheapestRows.map((pub, index) => (
                <Link key={pub.id} href={pubUrl(pub)} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4 no-underline hover:bg-off-white">
                  <span className="font-mono text-[0.72rem] font-bold text-gray-mid">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-gray-mid">
                      <span>{pub.suburb}</span>
                      <span>Checked {formatDate(pub.lastVerified ?? pub.priceVerifiedAt)}</span>
                    </span>
                  </span>
                  <span className="font-mono text-lg font-extrabold text-ink">{formatAudPrice(pub.regularPrice)}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
              <div className="mb-3 flex items-center gap-2">
                <Ruler className="h-4 w-4 text-amber" />
                <h2 className="font-mono text-lg font-extrabold text-ink">What is a pint?</h2>
              </div>
              <p className="font-body text-[0.85rem] leading-relaxed text-gray-mid">
                On this site, a pint means 570ml. A schooner is 425ml and a middy is 285ml. If a venue only confirms a schooner or middy, we keep that glass size with the pub and do not inflate it into a pint number.
              </p>
            </section>

            <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
              <div className="mb-3 flex items-center gap-2">
                <Beer className="h-4 w-4 text-amber" />
                <h2 className="font-mono text-lg font-extrabold text-ink">Quick Q&A</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="type-card">Is a happy-hour pint included?</h3>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">No. The headline number uses regular pint prices only. Happy-hour deals move around by day and hour, so they live on the happy-hour pages.</p>
                </div>
                <div>
                  <h3 className="type-card">Why do some pubs show TBC?</h3>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">Because we have not confirmed a current regular pint price cleanly enough. TBC rows stay out of the average and median.</p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="mt-8 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
          <p className="type-eyebrow">Keep going</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { href: '/insights/pint-index', label: 'Perth Pint Index' },
              { href: '/cheapest-pints', label: 'Cheapest pints in Perth' },
              { href: '/happy-hour', label: 'Happy hours running now' },
              { href: '/articles/proper-pint-schooner-middy-perth', label: 'Pint, schooner, middy explainer' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-card border border-gray-light px-4 py-3 font-mono text-[0.76rem] font-bold text-ink no-underline hover:border-amber hover:text-amber">
                {link.label}<ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}
