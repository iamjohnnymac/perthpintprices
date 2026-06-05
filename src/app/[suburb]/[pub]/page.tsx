import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPubBySlug, getIndexablePubSlugPairs, getLatestAndrewCallAtByPubId, getNearestPubFromList, getNearbyPubs, getSiteStats, getSuburbAveragePrice, getVerifiedPricePubs } from '@/lib/supabase'
import { getPubIndexability } from '@/lib/pubIndexability'
import { getPriceRecency } from '@/lib/freshness'
import { buildPubJsonLd } from '@/lib/pubJsonLd'
import { absolutePubUrl, pubUrl, toSuburbSlug } from '@/lib/urls'
import { pubMetaDescription } from '@/lib/voiceCopy'
import type { Pub } from '@/types/pub'
import PubDetailClient from './PubDetailClient'

interface PageProps {
  params: { suburb: string; pub: string }
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

function getPubPageIndexability(pub: Pub) {
  return getPubIndexability({
    price: pub.regularPrice,
    priceVerified: pub.priceVerified,
    lastVerified: pub.lastVerified,
    happyHour: pub.happyHour,
    happyHourPrice: pub.happyHourPrice,
    happyHourDays: pub.happyHourDays,
    happyHourStart: pub.happyHourStart,
    happyHourEnd: pub.happyHourEnd,
    beerType: pub.beerType,
    vibeTag: pub.vibeTag,
    hasTab: pub.hasTab,
    kidFriendly: pub.kidFriendly,
    cozyPub: pub.cozyPub,
    sunsetSpot: pub.sunsetSpot,
    website: pub.website,
    businessStatus: pub.businessStatus,
  })
}

function formatMetaDate(value: string | null): string | null {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Australia/Perth',
  })
}

function formatMetaHappyHourLabel(value: string | null): string | null {
  if (!value) return null
  return value.replace(/,\s*/g, ', ')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pub = await getCachedPubBySlug(params.pub)
  if (!pub) return { title: 'Pub Not Found' }

  const indexability = getPubPageIndexability(pub)
  const suburbAvgPrice = await getSuburbAveragePrice(pub.suburb)
  const hhPrice = typeof pub.happyHourPrice === 'number' && pub.happyHourPrice > 0 ? pub.happyHourPrice : null
  const stablePrice = pub.regularPrice ?? hhPrice
  const isHappyHourOnly = pub.regularPrice == null && hhPrice != null
  const priceText = stablePrice !== null
    ? `$${stablePrice.toFixed(2)} ${isHappyHourOnly ? 'happy-hour pints' : 'pints'}`
    : 'Price TBC'
  const title = `${pub.name}, ${pub.suburb}: ${priceText}`
  const hhWindow = formatMetaHappyHourLabel(pub.happyHourLabel)
  const description = pubMetaDescription({
    pub: pub.name,
    suburb: pub.suburb,
    price: pub.regularPrice,
    suburbAvg: suburbAvgPrice,
    checkedDate: formatMetaDate(pub.priceVerifiedAt || pub.lastVerified),
    hhClause: hhWindow ? `Happy hour: ${hhWindow}.` : null,
    hhPrice,
    hhWindow,
  })

  const canonical = absolutePubUrl(pub)

  return {
    title,
    description,
    alternates: { canonical },
    robots: indexability.isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${pub.name}: ${priceText}`,
      description,
      url: canonical,
      siteName: 'Perth Pint Prices',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${pub.name} pint prices | Perth Pint Prices` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pub.name}: ${priceText} | Perth Pint Prices`,
      description,
    },
  }
}

export async function generateStaticParams() {
  const pairs = await getIndexablePubSlugPairs()
  return pairs
    .filter(pair => pair.indexabilityTier === 'A')
    .map(pair => ({ suburb: toSuburbSlug(pair.suburb), pub: pair.slug }))
}

export const dynamicParams = true
export const revalidate = 3600

export default async function PubPage({ params }: PageProps) {
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
      const sameSuburbVerifiedPubs = verifiedPricePubs.filter(nearbyPub =>
        nearbyPub.suburb === pub.suburb && nearbyPub.id !== pub.id
      )

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
    getSiteStats(),
    getSuburbAveragePrice(pub.suburb),
  ])

  const jsonLd = buildPubJsonLd(pub, suburbAvgPrice ?? Number(stats.avgPrice))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Server-rendered links for crawlers — ensures this pub page has strong internal linking */}
      <div className="sr-only" aria-hidden="true">
        <a href="/">Home</a>
        <a href={`/${suburbSlug}`}>{pub.suburb}</a>
        <a href="/suburbs">All Suburbs</a>
        {nearbyPubs.map(np => (
          <a key={np.slug} href={pubUrl({ suburb: np.suburb, slug: np.slug })}>{np.name} - {np.suburb}</a>
        ))}
      </div>

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
