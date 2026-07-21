import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPubBySlug, getIndexablePubSlugPairs, getLatestAndrewCallAtByPubId, getNearestPubFromList, getNearbyPubs, getSuburbAveragePrice, getVerifiedPricePubs } from '@/lib/supabase'
import { getCachedSiteStats } from '@/lib/cachedPubs'
import { getPriceRecency } from '@/lib/freshness'
import { buildPubJsonLd } from '@/lib/pubJsonLd'
import { toSuburbSlug } from '@/lib/urls'
import type { Pub } from '@/types/pub'
import PubDetailClient from './PubDetailClient'
import { buildPubPageMetadata, getPubPageIndexability } from './pubMetadata'
import { getEligibleVerifiedPubsInSuburb } from '@/lib/nearbyPubs'

interface PageProps {
  params: Promise<{ suburb: string; pub: string }>
}

function getCachedPubBySlug(slug: string) {
  return unstable_cache(
    () => getPubBySlug(slug),
    ['pub', slug],
    {
      tags: [`pub:${slug}`],
      revalidate: 3600,
    },
  )()
}

const getCachedVerifiedPricePubs = unstable_cache(
  () => getVerifiedPricePubs(),
  ['verified-price-pubs'],
  {
    tags: ['verified-price-pubs'],
    revalidate: 3600,
  },
)

const getCachedLatestAndrewCallAtByPubId = unstable_cache(
  () => getLatestAndrewCallAtByPubId(),
  ['latest-andrew-call-at-by-pub-id'],
  {
    tags: ['latest-andrew-call-at-by-pub-id'],
    revalidate: 3600,
  },
)

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params
  const pub = await getCachedPubBySlug(params.pub)
  if (!pub) return { title: 'Pub Not Found' }

  const suburbAvgPrice = await getSuburbAveragePrice(pub.suburb)
  return buildPubPageMetadata(pub, suburbAvgPrice)
}

export async function generateStaticParams() {
  const pairs = await getIndexablePubSlugPairs()
  return pairs
    .filter(pair => pair.indexabilityTier === 'A')
    .map(pair => ({ suburb: toSuburbSlug(pair.suburb), pub: pair.slug }))
}

export const dynamicParams = true
export const revalidate = 3600

export default async function PubPage(props: PageProps) {
  const params = await props.params
  const pub = await getCachedPubBySlug(params.pub)
  if (!pub) notFound()

  // Verify the suburb slug matches — redirect to correct URL if not
  const suburbSlug = toSuburbSlug(pub.suburb)
  if (suburbSlug !== params.suburb) {
    permanentRedirect(`/${suburbSlug}/${pub.slug}`)
  }

  const indexability = getPubPageIndexability(pub)
  const priceRecency = getPriceRecency(pub.lastVerified)
  const isTierCPage = indexability.tier === 'C'
  const tierCDetails: Promise<[number, string | null, Pub | null]> = isTierCPage
    ? Promise.all([getCachedVerifiedPricePubs(), getCachedLatestAndrewCallAtByPubId()]).then(([verifiedPricePubs, latestAndrewCallAtByPubId]) => {
      const sameSuburbVerifiedPubs = getEligibleVerifiedPubsInSuburb(pub, verifiedPricePubs)

      return [
        sameSuburbVerifiedPubs.length,
        latestAndrewCallAtByPubId[pub.id] ?? null,
        getNearestPubFromList(sameSuburbVerifiedPubs, pub.lat, pub.lng),
      ]
    })
    : Promise.resolve([0, null, null])

  const [nearbyPubs, [nearbyVerifiedPriceCount, latestAndrewCallAt, nearestVerifiedPub], stats, suburbAvgPrice] = await Promise.all([
    getNearbyPubs(pub, 4),
    tierCDetails,
    getCachedSiteStats(),
    getSuburbAveragePrice(pub.suburb),
  ])

  const jsonLd = buildPubJsonLd(pub, suburbAvgPrice ?? Number(stats.avgPrice))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <PubDetailClient
        pub={pub}
        priceRecency={priceRecency}
        nearbyPubs={nearbyPubs}
        avgPrice={Number(stats.avgPrice)}
        suburbAvgPrice={suburbAvgPrice}
        isTierCPage={isTierCPage}
        latestAndrewCallAt={latestAndrewCallAt}
        nearestVerifiedPub={nearestVerifiedPub}
        nearbyVerifiedPriceCount={nearbyVerifiedPriceCount}
      />
    </>
  )
}
