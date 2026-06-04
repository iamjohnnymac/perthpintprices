import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, GraduationCap, MapPin, PiggyBank } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import { getMapTileUrl } from '@/lib/mapTile'
import { getPubs } from '@/lib/supabase'
import { rankStudentPints, rankStudentPintsForCampus, STUDENT_CAMPUSES, type StudentPintPub } from '@/lib/studentPints'
import { BASE_URL, pubUrl } from '@/lib/urls'

const canonical = `${BASE_URL}/student-pints-perth`
const description = 'Student pints in Perth near UWA, Curtin and Murdoch, using verified sub-$10 regular pint prices where Perth Pint Prices has checked rows.'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Student Pints Perth',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'Student Pints Perth | Perth Pint Prices',
    description,
    url: canonical,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'TBC'
  return Number.isInteger(price) ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'date TBC'
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' })
}

function buildItemList(rows: StudentPintPub[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Student pints in Perth',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 20).map((pub, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}${pubUrl(pub)}`,
      name: `${pub.name} - ${formatPrice(pub.regularPrice)} near ${pub.campusShortName}`,
    })),
  }
}

export default async function StudentPintsPerthPage() {
  const pubs = await getPubs()
  const campusRows = STUDENT_CAMPUSES.map(campus => ({
    campus,
    rows: rankStudentPintsForCampus(pubs, campus),
  }))
  const allRows = rankStudentPints(pubs)
  const cheapest = allRows[0] ?? null
  const campusCount = campusRows.filter(group => group.rows.length > 0).length

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildItemList(allRows)).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: 'Student pints', url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'Student pints' }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <div className="grid gap-6 sm:grid-cols-[1fr_260px] sm:items-end">
          <div>
            <p className="mb-3 type-eyebrow">Campus budget guide</p>
            <h1 className="type-hero-editorial">
              Student pints in Perth
            </h1>
            <p className="mt-5 max-w-[620px] font-body text-[0.96rem] leading-relaxed text-gray-mid">
              Cheap pints near UWA, Curtin and Murdoch, with the boring but important rule up front: only verified regular pint prices under $10 make the list. Happy-hour chaos can have its own lecture theatre.
            </p>
          </div>
          <div className="rounded-card border-3 border-ink bg-amber p-5 shadow-hard-sm">
            <div className="mb-8 inline-flex items-center gap-2 rounded-pill border-3 border-ink bg-white px-4 py-2 font-mono text-[0.72rem] font-bold uppercase text-ink shadow-hard-sm">
              <GraduationCap className="h-4 w-4 text-amber" />
              Student list
            </div>
            <p className="type-eyebrow text-ink/55">Cheapest checked</p>
            <p className="mt-1 font-mono text-5xl font-extrabold text-ink">{formatPrice(cheapest?.regularPrice)}</p>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-ink/70">{cheapest ? `${cheapest.name}, near ${cheapest.campusShortName}` : 'No checked row yet.'}</p>
          </div>
        </div>

        <section className="my-8 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm">
          <p className="type-eyebrow text-white/55">Answer first</p>
          <h2 className="mt-2 type-section text-white">Where are the cheapest student pints in Perth?</h2>
          <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
            {cheapest ? <>The cheapest verified student-adjacent pint in this cut is {formatPrice(cheapest.regularPrice)} at <Link href={pubUrl(cheapest)} className="font-bold text-amber-light hover:underline">{cheapest.name}</Link>, about {formatDistance(cheapest.distanceKm)} direct from {cheapest.campusShortName}. UWA and Curtin have closer clusters; Murdoch needs a wider net in the current checked data.</> : <>We do not have a verified sub-$10 student row yet. That would be depressing, so hopefully it is temporary.</>}
          </p>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Campuses covered</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{campusCount}/3</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Campuses with at least one verified sub-$10 row.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Rows under $10</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{allRows.length}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Verified regular pint rows, not happy-hour specials.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Widest net</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">8km</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Murdoch needs more radius before checked rows appear.</p>
          </div>
        </section>

        <section className="grid gap-5">
          {campusRows.map(({ campus, rows }) => (
            <div key={campus.slug} className="rounded-card border-3 border-ink bg-white shadow-hard-sm">
              <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
                <div className="relative min-h-[170px] overflow-hidden border-b-3 border-ink sm:border-b-0 sm:border-r-3">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-75"
                    style={{ backgroundImage: `url(${getMapTileUrl(campus.lat, campus.lng, 15)})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-amber-pale/95" />
                  <div className="relative flex h-full min-h-[170px] flex-col justify-between p-4">
                    <div className="inline-flex w-fit items-center gap-2 rounded-pill border-3 border-ink bg-white px-3 py-2 font-mono text-[0.68rem] font-bold uppercase text-ink shadow-hard-sm">
                      <MapPin className="h-3.5 w-3.5 text-amber" />
                      {campus.shortName}
                    </div>
                    <div>
                      <p className="type-eyebrow">Radius</p>
                      <p className="mt-1 font-mono text-3xl font-extrabold text-ink">{campus.radiusKm}km</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-b border-gray-light bg-off-white px-5 py-4">
                    <p className="type-eyebrow">{campus.name}</p>
                    <h2 className="mt-1 type-section">{campus.shortName} cheap pints</h2>
                    <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">{campus.note}</p>
                  </div>
                  <div className="divide-y divide-gray-light">
                    {rows.length > 0 ? rows.map((pub, index) => (
                      <Link key={`${campus.slug}-${pub.id}`} href={pubUrl(pub)} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-5 py-4 no-underline hover:bg-off-white">
                        <span className="font-mono text-[0.72rem] font-bold text-gray-mid">{index + 1}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-gray-mid">
                            <span>{pub.suburb}</span>
                            <span>{formatDistance(pub.distanceKm)} direct</span>
                            <span>Checked {formatDate(pub.lastVerified ?? pub.priceVerifiedAt)}</span>
                          </span>
                        </span>
                        <span className="font-mono text-lg font-extrabold text-ink">{formatPrice(pub.regularPrice)}</span>
                      </Link>
                    )) : (
                      <div className="px-5 py-6">
                        <p className="font-body text-[0.85rem] leading-relaxed text-gray-mid">No verified sub-$10 regular pint rows inside this campus radius yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
          <div className="mb-3 flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-amber" />
            <h2 className="font-mono text-lg font-extrabold text-ink">Useful next clicks</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: '/cheapest-pints', label: 'Cheapest pints in Perth' },
              { href: '/happy-hour', label: 'Happy hours running now' },
              { href: '/pubs-near-perth-station', label: 'Pubs near Perth Station' },
              { href: '/articles/pints-under-10-perth', label: 'Under-$10 guide' },
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
