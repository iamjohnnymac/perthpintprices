import type { Metadata } from 'next'
import { getPubIndexability } from '@/lib/pubIndexability'
import { absolutePubUrl } from '@/lib/urls'
import { pubMetaDescription } from '@/lib/voiceCopy'
import type { Pub } from '@/types/pub'

export function getPubPageIndexability(pub: Pub, now?: Date) {
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
    now,
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

export function buildPubPageMetadata(pub: Pub, suburbAvgPrice: number | null, now?: Date): Metadata {
  const indexability = getPubPageIndexability(pub, now)
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
