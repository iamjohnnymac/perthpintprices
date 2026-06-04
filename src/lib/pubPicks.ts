import type { Pub } from '@/types/pub'

/**
 * The Dad Bar: a pub you can take the kids to and still have a pint.
 *
 * Hand-curated `kidFriendly` venues (the ones with playground notes), PLUS pubs
 * Google confirms are good for children AND have a beer garden or show the
 * footy. The CBD is excluded — a dad bar is a suburban thing, and Google
 * over-flags CBD bars as kid-friendly (e.g. $17 rooftop cocktail bars).
 *
 * Membership uses regularPrice (the stable standard pint), not the happy-hour
 * aware pub.price, so the list doesn't change by time of day.
 *
 * Shared by the DadBar component and the Discover hub count so the card and the
 * page always agree.
 */
export function isDadBar(pub: Pub): boolean {
  if (pub.regularPrice == null || pub.regularPrice <= 0) return false
  if (pub.kidFriendly) return true
  return (
    pub.goodForChildren === true &&
    (pub.outdoorSeating === true || pub.goodForWatchingSports === true) &&
    pub.suburb !== 'Perth CBD'
  )
}
