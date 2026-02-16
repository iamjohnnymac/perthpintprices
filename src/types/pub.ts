export interface Pub {
  id: number
  name: string
  address: string
  suburb: string
  lat: number
  lng: number
  price: number
  beerType: string
  happyHour: string | null
  website: string | null
  description: string | null
  source?: string
  lastUpdated?: string
}
