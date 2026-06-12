export interface Pub {
  id: number
  slug: string
  name: string
  address: string
  suburb: string
  lat: number
  lng: number
  price: number | null
  beerType: string
  happyHour: string | null
  website: string | null
  description: string | null
  priceSource: string | null
  priceVerifiedAt: string | null
  priceConfidence: 'high' | 'medium' | 'low' | null
  lastUpdated?: string
  sunsetSpot?: boolean
  priceVerified: boolean
  hasTab: boolean
  kidFriendly: boolean
  // Dynamic happy hour fields
  happyHourPrice: number | null
  happyHourDays: string | null
  happyHourStart: string | null
  happyHourEnd: string | null
  lastVerified: string | null
  // Computed at runtime
  regularPrice: number | null
  isHappyHourNow: boolean
  happyHourLabel: string | null
  happyHourMinutesRemaining: number | null
  imageUrl: string | null
  vibeTag: string | null
  cozyPub: boolean
  effectivePrice: number | null
  distanceKm?: number | null
  // Google Places (New) attribute backfill — sourced, attributable, often sparse.
  // Always set by toPub() (null when Google has no signal); optional so the many
  // direct Pub fixtures/literals don't all need updating.
  // null = unknown; false = Google says no; true = yes.
  servesBeer?: boolean | null
  servesFood?: boolean | null
  outdoorSeating?: boolean | null
  goodForChildren?: boolean | null
  goodForGroups?: boolean | null
  goodForWatchingSports?: boolean | null
  allowsDogs?: boolean | null
  liveMusic?: boolean | null
  restroom?: boolean | null
  reservable?: boolean | null
  googleRating?: number | null
  googleRatingCount?: number | null
  googlePriceLevel?: string | null
  businessStatus?: string | null
  googleEditorialSummary?: string | null
  googleOpeningHours?: GoogleOpeningHours | null
  googleAttrsUpdatedAt?: string | null
  // One Google Places photo + its required contributor attribution. Refreshed on
  // the monthly Places sweep; must always be displayed with the attribution.
  googlePhotoUrl?: string | null
  googlePhotoAttribution?: string | null
  googlePhotoAttributionUri?: string | null
}

// Subset of the Places (New) regularOpeningHours object we persist + render.
export interface GoogleOpeningHours {
  periods?: Array<{
    open?: { day: number; hour: number; minute: number }
    close?: { day: number; hour: number; minute: number }
  }>
  weekdayDescriptions?: string[]
}
