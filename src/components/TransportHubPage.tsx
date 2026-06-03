import Link from 'next/link'
import { ArrowUpRight, Clock, MapPin, TrainFront } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import { getMapTileUrl } from '@/lib/mapTile'
import { getPubs } from '@/lib/supabase'
import { rankPubsForTransportHub, TRANSPORT_HUBS, type TransportHub, type TransportHubPub } from '@/lib/transportHubs'
import { BASE_URL, pubUrl } from '@/lib/urls'

type TransportHubPageProps = {
  hub: TransportHub
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

function formatVerifiedPrice(pub: TransportHubPub): string {
  return pub.priceVerified ? formatPrice(pub.regularPrice) : 'TBC'
}

function formatVerifiedDate(pub: TransportHubPub): string {
  return pub.priceVerified ? `Checked ${formatDate(pub.lastVerified ?? pub.priceVerifiedAt)}` : 'Price TBC'
}

function buildItemList(rows: TransportHubPub[], hub: TransportHub) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pubs ${hub.nearbyLabel}`,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 20).map((pub, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}${pubUrl(pub)}`,
      name: `${pub.name} - ${formatDistance(pub.distanceKm)} from ${hub.shortName}`,
    })),
  }
}

export default async function TransportHubPage({ hub }: TransportHubPageProps) {
  const pubs = await getPubs()
  const nearbyPubs = rankPubsForTransportHub(pubs, hub)
  const pricedRows = nearbyPubs.filter(pub => pub.priceVerified && pub.regularPrice !== null)
  const cheapest = pricedRows
    .slice()
    .sort((a, b) => (a.regularPrice ?? Number.MAX_VALUE) - (b.regularPrice ?? Number.MAX_VALUE))[0] ?? null
  const closest = nearbyPubs[0] ?? null
  const canonical = `${BASE_URL}/${hub.slug}`
  const otherHubs = TRANSPORT_HUBS.filter(other => other.slug !== hub.slug)

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildItemList(nearbyPubs, hub)).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: hub.name, url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: hub.shortName }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <div className="grid gap-6 sm:grid-cols-[1fr_260px] sm:items-end">
          <div>
            <p className="mb-3 font-mono text-[0.68rem] font-bold uppercase text-gray-mid">Transport pub guide</p>
            <h1 className="font-display text-[3rem] leading-[1] text-ink sm:text-[4.7rem]">
              Pubs near {hub.name}
            </h1>
            <p className="mt-5 max-w-[620px] font-body text-[0.96rem] leading-relaxed text-gray-mid">
              {hub.intro}
            </p>
          </div>
          <div className="relative min-h-[260px] overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-75"
              style={{ backgroundImage: `url(${getMapTileUrl(hub.lat, hub.lng, 15)})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-amber-pale/95" />
            <div className="relative flex h-full min-h-[260px] flex-col justify-between p-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-pill border-3 border-ink bg-white px-4 py-2 font-mono text-[0.72rem] font-bold uppercase text-ink shadow-hard-sm">
                <TrainFront className="h-4 w-4 text-amber" />
                {hub.shortName}
              </div>
              <div>
                <p className="font-mono text-[0.65rem] font-bold uppercase text-gray-mid">Search radius</p>
                <p className="mt-1 font-mono text-4xl font-extrabold text-ink">{hub.radiusKm.toFixed(1)}km</p>
              </div>
            </div>
          </div>
        </div>

        <section className="my-8 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm">
          <p className="font-mono text-[0.65rem] font-bold uppercase text-white/55">Answer first</p>
          <h2 className="mt-2 font-mono text-xl font-extrabold">What is the best pub near {hub.name}?</h2>
          <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
            {closest ? <>The closest pub in the current dataset is <Link href={pubUrl(closest)} className="font-bold text-amber-light hover:underline">{closest.name}</Link> in {closest.suburb}, about {formatDistance(closest.distanceKm)} direct from {hub.shortName}. {cheapest ? <>The cheapest verified regular pint nearby is {formatPrice(cheapest.regularPrice)} at {cheapest.name}.</> : <>We do not have a verified regular pint price for this hub yet.</>} {hub.answerNote}</> : <>We do not have enough nearby pub data for this hub yet.</>}
          </p>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="font-mono text-[0.65rem] font-bold uppercase text-gray-mid">Nearby pubs</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{nearbyPubs.length}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Within {hub.radiusKm.toFixed(1)}km direct of {hub.shortName}.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="font-mono text-[0.65rem] font-bold uppercase text-gray-mid">Closest</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{closest ? formatDistance(closest.distanceKm) : 'TBC'}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{closest ? `${closest.name}, ${closest.suburb}` : 'Needs nearby rows.'}</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="font-mono text-[0.65rem] font-bold uppercase text-gray-mid">Cheapest checked</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatPrice(cheapest?.regularPrice)}</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{cheapest ? `${cheapest.name}, ${cheapest.suburb}` : 'No verified price yet.'}</p>
          </div>
        </section>

        <section className="rounded-card border-3 border-ink bg-white shadow-hard-sm">
          <div className="flex items-center justify-between gap-4 border-b-3 border-ink bg-off-white px-5 py-4">
            <div>
              <p className="font-mono text-[0.65rem] font-bold uppercase text-gray-mid">Sorted by direct distance</p>
              <h2 className="font-mono text-xl font-extrabold text-ink">Nearby rows</h2>
            </div>
            <MapPin className="h-5 w-5 text-amber" />
          </div>
          <div className="divide-y divide-gray-light">
            {nearbyPubs.length > 0 ? nearbyPubs.map((pub, index) => (
              <Link key={pub.id} href={pubUrl(pub)} className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-5 py-4 no-underline hover:bg-off-white">
                <span className="font-mono text-[0.72rem] font-bold text-gray-mid">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-gray-mid">
                    <span>{pub.suburb}</span>
                    <span>{formatDistance(pub.distanceKm)}</span>
                    <span>{formatVerifiedDate(pub)}</span>
                  </span>
                </span>
                <span className="font-mono text-lg font-extrabold text-ink">{formatVerifiedPrice(pub)}</span>
              </Link>
            )) : (
              <div className="px-5 py-8">
                <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid">No nearby rows yet. Annoying, but more honest than a fake shortlist.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber" />
              <h2 className="font-mono text-lg font-extrabold text-ink">Before you choose</h2>
            </div>
            <p className="font-body text-[0.82rem] leading-relaxed text-gray-mid">{hub.timingNote}</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <h2 className="font-mono text-lg font-extrabold text-ink">Other transport guides</h2>
            <div className="mt-4 grid gap-2">
              {otherHubs.map(other => (
                <Link key={other.slug} href={`/${other.slug}`} className="flex items-center justify-between rounded-card border border-gray-light px-4 py-3 font-mono text-[0.76rem] font-bold text-ink no-underline hover:border-amber hover:text-amber">
                  {other.name}<ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}
