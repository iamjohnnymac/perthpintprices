import { haversineDistanceKm } from '@/lib/location'
import type { Pub } from '@/types/pub'

export const NEARBY_RADIUS_KM = 2
export const NEARBY_FALLBACK_MIN_RESULTS = 3

export function hasUsableCoordinates(pub: Pick<Pub, 'lat' | 'lng'>): boolean {
  return Number.isFinite(pub.lat) && Number.isFinite(pub.lng) && !(pub.lat === 0 && pub.lng === 0)
}

function comparablePrice(pub: Pub): number | null {
  return pub.effectivePrice ?? pub.price ?? pub.regularPrice
}

function withDistance(currentPub: Pub, pub: Pub): Pub {
  return {
    ...pub,
    distanceKm: hasUsableCoordinates(currentPub) && hasUsableCoordinates(pub)
      ? haversineDistanceKm(currentPub.lat, currentPub.lng, pub.lat, pub.lng)
      : null,
  }
}

function uniqueById(pubs: Pub[]): Pub[] {
  const seen = new Set<number>()
  return pubs.filter(pub => {
    if (seen.has(pub.id)) return false
    seen.add(pub.id)
    return true
  })
}

function sortNearby(a: Pub, b: Pub): number {
  const aDistance = a.distanceKm ?? Number.MAX_VALUE
  const bDistance = b.distanceKm ?? Number.MAX_VALUE
  const aPrice = comparablePrice(a) ?? Number.MAX_VALUE
  const bPrice = comparablePrice(b) ?? Number.MAX_VALUE

  return aDistance - bDistance || aPrice - bPrice || a.name.localeCompare(b.name)
}

export function rankNearbyPubs(
  currentPub: Pub,
  candidates: Pub[],
  limit = 4,
  radiusKm = NEARBY_RADIUS_KM,
): Pub[] {
  const pricedCandidates = uniqueById(candidates)
    .filter(pub => pub.id !== currentPub.id && pub.price !== null && pub.priceVerified)
    .map(pub => withDistance(currentPub, pub))

  const inRadius = hasUsableCoordinates(currentPub)
    ? pricedCandidates.filter(pub => typeof pub.distanceKm === 'number' && pub.distanceKm <= radiusKm)
    : []

  const sameSuburb = pricedCandidates.filter(pub => pub.suburb === currentPub.suburb)
  const candidatePool = uniqueById(
    inRadius.length >= NEARBY_FALLBACK_MIN_RESULTS
      ? inRadius
      : [...inRadius, ...sameSuburb],
  )

  const currentPrice = comparablePrice(currentPub)
  const cheaperPubs = currentPrice === null
    ? []
    : candidatePool.filter(pub => {
      const price = comparablePrice(pub)
      return price !== null && price < currentPrice
    })

  return (cheaperPubs.length > 0 ? cheaperPubs : candidatePool)
    .sort(sortNearby)
    .slice(0, limit)
}
