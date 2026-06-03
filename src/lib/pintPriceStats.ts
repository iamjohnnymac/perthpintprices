import type { Pub } from '@/types/pub'

export interface PintPriceStats {
  trackedCount: number
  verifiedCount: number
  suburbCount: number
  averagePrice: number | null
  medianPrice: number | null
  minPrice: number | null
  maxPrice: number | null
  underTenCount: number
  cheapestPub: Pub | null
  verifiedPubs: Pub[]
}

export function getVerifiedRegularPubs(pubs: Pub[]): Pub[] {
  return pubs
    .filter(pub => pub.priceVerified && pub.regularPrice !== null)
    .sort((a, b) => (a.regularPrice ?? Number.MAX_VALUE) - (b.regularPrice ?? Number.MAX_VALUE))
}

function getMedian(prices: number[]): number | null {
  if (prices.length === 0) return null

  const midpoint = Math.floor(prices.length / 2)
  if (prices.length % 2 === 1) return prices[midpoint]

  return (prices[midpoint - 1] + prices[midpoint]) / 2
}

export function getPintPriceStats(pubs: Pub[]): PintPriceStats {
  const verifiedPubs = getVerifiedRegularPubs(pubs)
  const prices = verifiedPubs.map(pub => pub.regularPrice as number)

  return {
    trackedCount: pubs.length,
    verifiedCount: verifiedPubs.length,
    suburbCount: new Set(pubs.map(pub => pub.suburb).filter(Boolean)).size,
    averagePrice: prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : null,
    medianPrice: getMedian(prices),
    minPrice: prices[0] ?? null,
    maxPrice: prices.at(-1) ?? null,
    underTenCount: verifiedPubs.filter(pub => (pub.regularPrice ?? Number.MAX_VALUE) < 10).length,
    cheapestPub: verifiedPubs[0] ?? null,
    verifiedPubs,
  }
}

export function formatAudPrice(price: number | null | undefined): string {
  if (price == null) return 'TBC'
  return Number.isInteger(price) ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}
