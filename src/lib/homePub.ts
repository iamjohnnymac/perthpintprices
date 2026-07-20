import type { Pub } from '@/types/pub'

export type HomePub = Pick<Pub,
  | 'id'
  | 'slug'
  | 'name'
  | 'address'
  | 'suburb'
  | 'lat'
  | 'lng'
  | 'price'
  | 'beerType'
  | 'happyHour'
  | 'description'
  | 'priceVerified'
  | 'kidFriendly'
  | 'hasTab'
  | 'lastVerified'
  | 'regularPrice'
  | 'isHappyHourNow'
  | 'vibeTag'
>

export function toHomePub(pub: Pub): HomePub {
  return {
    id: pub.id,
    slug: pub.slug,
    name: pub.name,
    address: pub.address,
    suburb: pub.suburb,
    lat: pub.lat,
    lng: pub.lng,
    price: pub.price,
    beerType: pub.beerType,
    happyHour: pub.happyHour,
    description: pub.description,
    priceVerified: pub.priceVerified,
    kidFriendly: pub.kidFriendly,
    hasTab: pub.hasTab,
    lastVerified: pub.lastVerified,
    regularPrice: pub.regularPrice,
    isHappyHourNow: pub.isHappyHourNow,
    vibeTag: pub.vibeTag,
  }
}
