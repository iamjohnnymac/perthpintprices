export interface Pub {
  id: number
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
  source?: string
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
}
