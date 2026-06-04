import assert from 'node:assert/strict'
import test from 'node:test'
import { getPricedSuburbCount, getSuburbExtremes, getSuburbStats } from './suburbStats'
import type { Pub } from '@/types/pub'

function pub(overrides: Partial<Pub>): Pub {
  return {
    id: 1,
    slug: 'test-pub',
    name: 'Test Pub',
    address: '',
    suburb: 'Perth',
    lat: -31.95,
    lng: 115.86,
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
    regularPrice: 9,
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

test('getSuburbStats needs minPubCount verified-priced pubs per suburb', () => {
  const stats = getSuburbStats([
    pub({ id: 1, suburb: 'Midland', regularPrice: 7 }),
    pub({ id: 2, suburb: 'Midland', regularPrice: 8 }),
    pub({ id: 3, suburb: 'Solo', regularPrice: 8 }), // only one priced → excluded
  ])
  assert.deepEqual(stats.map(s => s.suburb), ['Midland'])
  assert.equal(stats[0].pricedCount, 2)
})

test('getSuburbStats uses regularPrice + priceVerified, never pub.price', () => {
  // A suburb where the runtime pub.price (happy-hour) is low but the regular price is $10,
  // and one unverified $5 row that must be ignored.
  const stats = getSuburbStats([
    pub({ id: 1, suburb: 'Northbridge', regularPrice: 10, price: 5 }),
    pub({ id: 2, suburb: 'Northbridge', regularPrice: 10, price: 5 }),
    pub({ id: 3, suburb: 'Northbridge', regularPrice: 5, priceVerified: false }),
  ])
  assert.equal(stats.length, 1)
  assert.equal(stats[0].avgPrice, 10) // ignores pub.price=5 and the unverified row
  assert.equal(stats[0].pricedCount, 2)
})

test('getSuburbStats sorts ascending by average and counts coverage separately', () => {
  const stats = getSuburbStats([
    pub({ id: 1, suburb: 'Pricey', regularPrice: 12 }),
    pub({ id: 2, suburb: 'Pricey', regularPrice: 14 }),
    pub({ id: 3, suburb: 'Cheap', regularPrice: 7 }),
    pub({ id: 4, suburb: 'Cheap', regularPrice: 7 }),
    pub({ id: 5, suburb: 'Cheap', regularPrice: null }), // TBC: counts as coverage, not in avg
  ])
  assert.deepEqual(stats.map(s => s.suburb), ['Cheap', 'Pricey'])
  const cheap = stats[0]
  assert.equal(cheap.avgPrice, 7)
  assert.equal(cheap.pricedCount, 2)
  assert.equal(cheap.pubCount, 3) // includes the TBC row
})

test('getSuburbExtremes returns cheapest and priciest', () => {
  const { cheapest, priciest } = getSuburbExtremes([
    pub({ id: 1, suburb: 'A', regularPrice: 7 }),
    pub({ id: 2, suburb: 'A', regularPrice: 7 }),
    pub({ id: 3, suburb: 'B', regularPrice: 12 }),
    pub({ id: 4, suburb: 'B', regularPrice: 12 }),
  ])
  assert.equal(cheapest?.suburb, 'A')
  assert.equal(priciest?.suburb, 'B')
})

test('getPricedSuburbCount counts suburbs with a verified price (not coverage)', () => {
  const count = getPricedSuburbCount([
    pub({ id: 1, suburb: 'A', regularPrice: 8 }),
    pub({ id: 2, suburb: 'B', regularPrice: null }), // no price → not counted
    pub({ id: 3, suburb: 'C', regularPrice: 9, priceVerified: false }), // unverified → not counted
  ])
  assert.equal(count, 1)
})
