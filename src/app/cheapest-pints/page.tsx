import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Beer, CalendarDays, ListChecks } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import { getPubs } from '@/lib/supabase'
import { BASE_URL, pubUrl } from '@/lib/urls'
import type { Pub } from '@/types/pub'

const canonical = `${BASE_URL}/cheapest-pints`
const description = 'The cheapest verified pints in Perth, sorted from live Perth Pint Prices data with checked dates, suburb notes, and useful pub links.'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Cheapest Pints in Perth',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'Cheapest Pints in Perth | Perth Pint Prices',
    description,
    url: canonical,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: `${BASE_URL}/articles/pints-under-10-perth-01-fremantle-6-pint.png`, width: 1200, height: 630, alt: 'A cheap Perth pint on a pub table' }],
  },
  twitter: { card: 'summary_large_image' },
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'TBC'
  return Number.isInteger(price) ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'date TBC'
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' })
}

function buildItemList(rows: Pub[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cheapest verified pints in Perth',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 20).map((pub, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}${pubUrl(pub)}`,
      name: `${pub.name} - ${formatPrice(pub.regularPrice)} pint`,
    })),
  }
}

export default async function CheapestPintsPage() {
  const pubs = await getPubs()
  const verified = pubs
    .filter(pub => pub.priceVerified && pub.regularPrice !== null)
    .sort((a, b) => (a.regularPrice ?? 999) - (b.regularPrice ?? 999))
  const under10 = verified.filter(pub => (pub.regularPrice ?? 999) < 10)
  const topRows = verified.slice(0, 24)
  const cheapest = topRows[0] ?? null
  const suburbCount = new Set(topRows.map(pub => pub.suburb)).size
  const average = verified.length > 0
    ? verified.reduce((sum, pub) => sum + (pub.regularPrice ?? 0), 0) / verified.length
    : null

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildItemList(topRows)).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: 'Cheapest pints', url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'Cheapest pints' }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <div className="grid gap-6 sm:grid-cols-[1fr_260px] sm:items-end">
          <div>
            <p className="mb-3 type-eyebrow">Live ranked list</p>
            <h1 className="type-hero-editorial">
              Cheapest pints in Perth
            </h1>
            <p className="mt-5 max-w-[620px] font-body text-[0.96rem] leading-relaxed text-gray-mid">
              The cheapest verified pint we have right now is {cheapest ? <><span className="font-mono font-bold text-ink">{formatPrice(cheapest.regularPrice)}</span> at {cheapest.name} in {cheapest.suburb}</> : 'still being checked'}. This page only uses pubs with a verified regular pint price, then sorts the lot from cheapest up. Happy-hour prices are useful, but they do not get smuggled into the regular-price table.
            </p>
          </div>
          <div className="overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <Image
              src="/articles/pints-under-10-perth-01-fremantle-6-pint.png"
              alt="A verified cheap pint in Perth"
              width={700}
              height={700}
              className="aspect-square w-full object-cover"
              priority
            />
          </div>
        </div>

        <section className="my-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Cheapest checked</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatPrice(cheapest?.regularPrice)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{cheapest ? `${cheapest.name}, ${cheapest.suburb}` : 'No verified rows yet.'}</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Under $10</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{under10.length}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Verified regular pint rows below the ten-dollar line.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">City average</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatPrice(average)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{verified.length} verified pubs across the live dataset.</p>
          </div>
        </section>

        <section className="mb-8 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm">
          <p className="type-eyebrow text-white/55">Answer first</p>
          <h2 className="mt-2 type-section text-white">Where is the cheapest pint in Perth?</h2>
          <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
            {cheapest ? <>The cheapest verified pint in Perth is {formatPrice(cheapest.regularPrice)} at <Link href={pubUrl(cheapest)} className="font-bold text-amber-light hover:underline">{cheapest.name}</Link> in {cheapest.suburb}, checked {formatDate(cheapest.lastVerified ?? cheapest.priceVerifiedAt)}. The top 24 checked rows currently cover {suburbCount} suburbs, which is why the useful answer is a ranked list rather than one suburb headline.</> : 'We do not have a verified regular pint row to publish yet.'}
          </p>
        </section>

        <section className="rounded-card border-3 border-ink bg-white shadow-hard-sm">
          <div className="flex items-center justify-between gap-4 border-b-3 border-ink bg-off-white px-5 py-4">
            <div>
              <p className="type-eyebrow">Verified regular prices</p>
              <h2 className="type-section">Cheapest rows</h2>
            </div>
            <ListChecks className="h-5 w-5 text-amber" />
          </div>
          <div className="divide-y divide-gray-light">
            {topRows.map((pub, index) => (
              <Link key={pub.id} href={pubUrl(pub)} className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-5 py-4 no-underline hover:bg-off-white">
                <span className="font-mono text-[0.72rem] font-bold text-gray-mid">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-gray-mid">
                    <span>{pub.suburb}</span>
                    <span>Checked {formatDate(pub.lastVerified ?? pub.priceVerifiedAt)}</span>
                    {pub.beerType && <span>{pub.beerType}</span>}
                  </span>
                </span>
                <span className="font-mono text-lg font-extrabold text-ink">{formatPrice(pub.regularPrice)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="mb-3 flex items-center gap-2">
              <Beer className="h-4 w-4 text-amber" />
              <h2 className="font-mono text-lg font-extrabold text-ink">Useful next clicks</h2>
            </div>
            <div className="grid gap-2">
              {[
                { href: '/happy-hour', label: 'Happy hours running now' },
                { href: '/happy-hour/friday', label: 'Friday happy hours' },
                { href: '/articles/pints-under-10-perth', label: 'Read the under-$10 guide' },
                { href: '/discover', label: 'Filter every pub price' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-card border border-gray-light px-4 py-3 font-mono text-[0.78rem] font-bold text-ink no-underline hover:border-amber hover:text-amber">
                  {link.label}<ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber" />
              <h2 className="font-mono text-lg font-extrabold text-ink">Quick Q&A</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="type-card">Do happy-hour prices count here?</h3>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">No. This page ranks regular pint prices only. Happy hours get their own day pages because a one-hour pint is not the same promise as the normal price.</p>
              </div>
              <div>
                <h3 className="type-card">Why is a pub missing?</h3>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">Usually because the regular pint price is still TBC or stale. We would rather show an honest gap than a tidy guess.</p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}
