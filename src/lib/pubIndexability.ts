import { getPriceRecency } from '@/lib/freshness'

export type PubIndexabilityTier = 'A' | 'B' | 'C'

export interface PubIndexabilityInput {
  price: number | null
  priceVerified?: boolean | null
  lastVerified?: string | null
  happyHour?: string | null
  happyHourPrice?: number | null
  happyHourDays?: string | null
  happyHourStart?: string | null
  happyHourEnd?: string | null
  beerType?: string | null
  vibeTag?: string | null
  hasTab?: boolean | null
  kidFriendly?: boolean | null
  cozyPub?: boolean | null
  sunsetSpot?: boolean | null
  website?: string | null
  businessStatus?: string | null
  now?: Date
}

export interface PubIndexability {
  dataScore: number
  tier: PubIndexabilityTier
  isIndexable: boolean
}

function hasPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function getPubIndexability(pub: PubIndexabilityInput): PubIndexability {
  // Permanently-closed venues (Places business_status) are forced out of indexing
  // and the sitemap below — but keep their data-driven tier so on-page rendering
  // (e.g. the Tier-C "no price yet" stub) stays correct for closed-but-priced pubs.
  const closed = pub.businessStatus === 'CLOSED_PERMANENTLY'

  const hasPrice = hasPositiveNumber(pub.price)
  const priceRecency = getPriceRecency(pub.lastVerified, pub.now)
  const hasCurrentRecency = priceRecency.tier === 'fresh' || priceRecency.tier === 'aging'
  const hasVerifiedPrice = hasPrice && pub.priceVerified !== false && hasCurrentRecency
  const hasHappyHour = hasText(pub.happyHour)
    || hasPositiveNumber(pub.happyHourPrice)
    || (hasText(pub.happyHourDays) && hasText(pub.happyHourStart) && hasText(pub.happyHourEnd))

  const attributeCount = [
    pub.beerType,
    pub.vibeTag,
    pub.website,
  ].filter(hasText).length + [
    pub.hasTab,
    pub.kidFriendly,
    pub.cozyPub,
    pub.sunsetSpot,
  ].filter(Boolean).length

  const recencyScore = hasPrice && pub.priceVerified !== false
    ? { fresh: 2, aging: 1, stale: 0, unknown: 0 }[priceRecency.tier]
    : 0

  const dataScore = [
    hasPrice ? 2 : 0,
    recencyScore,
    hasHappyHour ? 2 : 0,
    Math.min(attributeCount, 2),
  ].reduce((sum, score) => sum + score, 0)

  const base: PubIndexability =
    hasVerifiedPrice || (hasHappyHour && attributeCount > 0)
      ? { dataScore, tier: 'A', isIndexable: true }
      : hasPrice || hasHappyHour
        ? { dataScore, tier: 'B', isIndexable: true }
        : { dataScore, tier: 'C', isIndexable: false }

  return closed ? { ...base, isIndexable: false } : base
}
