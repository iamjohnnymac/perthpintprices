import assert from 'node:assert/strict'
import test from 'node:test'
import { formatAudPrice, getPintPriceStats, getVerifiedRegularPubs } from './pintPriceStats'
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

test('getVerifiedRegularPubs keeps only verified regular pint rows sorted by price', () => {
  const rows = getVerifiedRegularPubs([
    pub({ id: 1, name: 'Nine', regularPrice: 9 }),
    pub({ id: 2, name: 'TBC', regularPrice: null }),
    pub({ id: 3, name: 'Unverified Seven', regularPrice: 7, priceVerified: false }),
    pub({ id: 4, name: 'Eight', regularPrice: 8 }),
  ])

  assert.deepEqual(rows.map(row => row.name), ['Eight', 'Nine'])
})

test('getPintPriceStats calculates average, median, range, and under-ten count', () => {
  const stats = getPintPriceStats([
    pub({ id: 1, suburb: 'Perth', regularPrice: 8 }),
    pub({ id: 2, suburb: 'Northbridge', regularPrice: 9.5 }),
    pub({ id: 3, suburb: 'Fremantle', regularPrice: 10.5 }),
    pub({ id: 4, suburb: 'Fremantle', regularPrice: 12 }),
    pub({ id: 5, suburb: 'Perth', regularPrice: null }),
  ])

  assert.equal(stats.trackedCount, 5)
  assert.equal(stats.verifiedCount, 4)
  assert.equal(stats.suburbCount, 3)
  assert.equal(stats.averagePrice, 10)
  assert.equal(stats.medianPrice, 10)
  assert.equal(stats.minPrice, 8)
  assert.equal(stats.maxPrice, 12)
  assert.equal(stats.underTenCount, 2)
  assert.equal(stats.cheapestPub?.name, 'Test Pub')
})

test('formatAudPrice keeps whole dollars compact and cents explicit', () => {
  assert.equal(formatAudPrice(null), 'TBC')
  assert.equal(formatAudPrice(9), '$9')
  assert.equal(formatAudPrice(9.5), '$9.50')
})
