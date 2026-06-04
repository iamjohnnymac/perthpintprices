import type { Pub } from '@/types/pub'

/**
 * Canonical per-suburb price stats. ONE definition shared by the Suburb
 * Rankings table, Venue Breakdown, the homepage, and the weekly snapshot, so
 * every surface agrees on the cheapest/priciest suburb.
 *
 * Always uses `regularPrice` + `priceVerified` (the stable standard-pint price),
 * never `pub.price` (which switches to the happy-hour price when HH is live).
 * Mirrors the proven logic in getAllSuburbs() in ./supabase.
 */
export interface SuburbStat {
  suburb: string
  /** verified-priced pubs — the basis of every figure below */
  pricedCount: number
  /** total tracked pubs in the suburb (coverage; includes TBC) */
  pubCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  happyHourPct: number
  /** % of priced pubs under $8 / $8–$11 / over $11 */
  spread: { cheap: number; mid: number; pricey: number }
}

function verifiedRegularPrice(pub: Pub): number | null {
  return pub.priceVerified && pub.regularPrice !== null && pub.regularPrice > 0 ? pub.regularPrice : null
}

export function getSuburbStats(pubs: Pub[], minPubCount = 2): SuburbStat[] {
  const grouped = new Map<string, Pub[]>()
  for (const pub of pubs) {
    if (!pub.suburb) continue
    const list = grouped.get(pub.suburb) ?? []
    list.push(pub)
    grouped.set(pub.suburb, list)
  }

  const stats: SuburbStat[] = []
  for (const [suburb, subPubs] of Array.from(grouped.entries())) {
    const prices = subPubs
      .map(verifiedRegularPrice)
      .filter((p): p is number => p !== null)
    if (prices.length < minPubCount) continue

    const total = prices.length
    const avg = prices.reduce((a, b) => a + b, 0) / total
    const hhCount = subPubs.filter(p => p.happyHour && p.happyHour.trim() !== '').length
    const cheap = prices.filter(p => p <= 8).length
    const mid = prices.filter(p => p > 8 && p <= 11).length
    const pricey = prices.filter(p => p > 11).length

    stats.push({
      suburb,
      pricedCount: total,
      pubCount: subPubs.length,
      avgPrice: Math.round(avg * 100) / 100,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      happyHourPct: Math.round((hhCount / subPubs.length) * 100),
      spread: {
        cheap: Math.round((cheap / total) * 100),
        mid: Math.round((mid / total) * 100),
        pricey: Math.round((pricey / total) * 100),
      },
    })
  }

  stats.sort((a, b) => a.avgPrice - b.avgPrice)
  return stats
}

/** Cheapest + priciest suburb from the canonical ranking. */
export function getSuburbExtremes(
  pubs: Pub[],
  minPubCount = 2,
): { cheapest: SuburbStat | null; priciest: SuburbStat | null } {
  const stats = getSuburbStats(pubs, minPubCount)
  return { cheapest: stats[0] ?? null, priciest: stats.at(-1) ?? null }
}

/** Suburbs that have at least one verified-priced pub (the stats denominator). */
export function getPricedSuburbCount(pubs: Pub[]): number {
  const set = new Set<string>()
  for (const pub of pubs) {
    if (pub.suburb && verifiedRegularPrice(pub) !== null) set.add(pub.suburb)
  }
  return set.size
}
