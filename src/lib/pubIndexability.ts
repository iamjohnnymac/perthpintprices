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
  const hasPrice = hasPositiveNumber(pub.price)
  const hasVerifiedPrice = hasPrice && pub.priceVerified !== false && hasText(pub.lastVerified)
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

  const dataScore = [
    hasPrice ? 2 : 0,
    hasVerifiedPrice ? 1 : 0,
    hasHappyHour ? 2 : 0,
    Math.min(attributeCount, 2),
  ].reduce((sum, score) => sum + score, 0)

  if (hasVerifiedPrice || (hasHappyHour && attributeCount > 0)) {
    return { dataScore, tier: 'A', isIndexable: true }
  }

  if (hasPrice || hasHappyHour) {
    return { dataScore, tier: 'B', isIndexable: true }
  }

  return { dataScore, tier: 'C', isIndexable: false }
}
