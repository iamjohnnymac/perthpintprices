import assert from 'node:assert/strict'
import test from 'node:test'
import { rankPubsForTransportHub, TRANSPORT_HUBS } from './transportHubs'
import type { Pub } from '@/types/pub'

function pub(overrides: Partial<Pub>): Pub {
  return {
    id: 1,
    slug: 'test-pub',
    name: 'Test Pub',
    address: '',
    suburb: 'Perth',
    lat: -31.9514,
    lng: 115.8605,
    price: null,
    beerType: '',
    happyHour: null,
    website: null,
    description: null,
    priceSource: null,
    priceVerifiedAt: null,
    priceConfidence: null,
    priceVerified: true,
    hasTab: false,
    kidFriendly: false,
    happyHourPrice: null,
    happyHourDays: null,
    happyHourStart: null,
    happyHourEnd: null,
    lastVerified: null,
    regularPrice: null,
    isHappyHourNow: false,
    happyHourLabel: null,
    happyHourMinutesRemaining: null,
    imageUrl: null,
    vibeTag: null,
    cozyPub: false,
    effectivePrice: null,
    ...overrides,
  }
}

test('rankPubsForTransportHub keeps pubs inside the hub radius sorted by direct distance', () => {
  const hub = TRANSPORT_HUBS[0]
  const rows = rankPubsForTransportHub([
    pub({ id: 1, name: 'Closest', lat: hub.lat, lng: hub.lng }),
    pub({ id: 2, name: 'Nearby', lat: hub.lat + 0.004, lng: hub.lng }),
    pub({ id: 3, name: 'Too Far', lat: hub.lat + 0.05, lng: hub.lng }),
  ], hub)

  assert.deepEqual(rows.map(row => row.name), ['Closest', 'Nearby'])
})

test('rankPubsForTransportHub uses price only as a tie breaker', () => {
  const hub = TRANSPORT_HUBS[0]
  const rows = rankPubsForTransportHub([
    pub({ id: 1, name: 'Higher Price', regularPrice: 12 }),
    pub({ id: 2, name: 'Lower Price', regularPrice: 8 }),
  ], hub)

  assert.deepEqual(rows.map(row => row.name), ['Lower Price', 'Higher Price'])
})

test('rankPubsForTransportHub ignores unverified prices for tie breaking', () => {
  const hub = TRANSPORT_HUBS[0]
  const rows = rankPubsForTransportHub([
    pub({ id: 1, name: 'Verified Price', regularPrice: 12, priceVerified: true }),
    pub({ id: 2, name: 'Unverified Price', regularPrice: 6, priceVerified: false }),
  ], hub)

  assert.deepEqual(rows.map(row => row.name), ['Verified Price', 'Unverified Price'])
})
