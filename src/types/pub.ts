export interface Pub {
  id: string
  name: string
  address: string
  suburb: string
  price: number
  beerType: string
  happyHour?: {
    days: string[]
    start: string
    end: string
  }
  coordinates: {
    lat: number
    lng: number
  }
  lastUpdated: string
  source: string
}
