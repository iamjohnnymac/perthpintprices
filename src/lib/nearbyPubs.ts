import { haversineDistanceKm } from '@/lib/location'
import { isCanonicalPubLinkEligible } from '@/lib/internalLinks'
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
  const eligibleCandidates = uniqueById(candidates)
    .filter(pub => pub.id !== currentPub.id && isCanonicalPubLinkEligible(pub))
    .map(pub => withDistance(currentPub, pub))

  const inRadius = hasUsableCoordinates(currentPub)
    ? eligibleCandidates.filter(pub => typeof pub.distanceKm === 'number' && pub.distanceKm <= radiusKm)
    : []

  const sameSuburb = eligibleCandidates.filter(pub => pub.suburb === currentPub.suburb)
  const candidatePool = uniqueById(
    inRadius.length >= NEARBY_FALLBACK_MIN_RESULTS
      ? inRadius
      : [...inRadius, ...sameSuburb],
  )

  const currentPrice = comparablePrice(currentPub)
  return candidatePool
    .sort((a, b) => {
      const aPrice = comparablePrice(a)
      const bPrice = comparablePrice(b)
      const aCheaper = currentPrice !== null && aPrice !== null && aPrice < currentPrice ? 0 : 1
      const bCheaper = currentPrice !== null && bPrice !== null && bPrice < currentPrice ? 0 : 1
      return aCheaper - bCheaper || sortNearby(a, b)
    })
    .slice(0, limit)
}
