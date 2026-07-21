import assert from 'node:assert/strict'
import test from 'node:test'
import type { Pub } from '@/types/pub'
import { rankNearbyPubs } from './nearbyPubs'

function pub(overrides: Partial<Pub>): Pub {
  return {
    id: 1,
    slug: 'current',
    name: 'Current Pub',
    address: '',
    suburb: 'Perth',
    lat: -31.9523,
    lng: 115.8613,
    price: 10,
    regularPrice: 10,
    effectivePrice: 10,
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
    cozyPub: false,
    happyHourPrice: null,
    happyHourDays: null,
    happyHourStart: null,
    happyHourEnd: null,
    lastVerified: null,
    isHappyHourNow: false,
    happyHourLabel: null,
    happyHourMinutesRemaining: null,
    imageUrl: null,
    vibeTag: null,
    ...overrides,
  }
}

test('rankNearbyPubs ranks cheaper cross-suburb pubs first without excluding other neighbours', () => {
  const current = pub({})
  const ranked = rankNearbyPubs(current, [
    pub({ id: 2, name: 'Same Suburb Expensive', slug: 'same', suburb: 'Perth', lat: -31.953, lng: 115.862, price: 11, regularPrice: 11, effectivePrice: 11 }),
    pub({ id: 3, name: 'Northbridge Cheap', slug: 'northbridge-cheap', suburb: 'Northbridge', lat: -31.946, lng: 115.858, price: 8, regularPrice: 8, effectivePrice: 8 }),
    pub({ id: 4, name: 'East Perth Cheap', slug: 'east-perth-cheap', suburb: 'East Perth', lat: -31.955, lng: 115.872, price: 9, regularPrice: 9, effectivePrice: 9 }),
  ])

  assert.deepEqual(ranked.map(item => item.name), ['Northbridge Cheap', 'East Perth Cheap', 'Same Suburb Expensive'])
  assert.equal(typeof ranked[0].distanceKm, 'number')
})

test('rankNearbyPubs falls back to same suburb when radius results are sparse', () => {
  const current = pub({})
  const ranked = rankNearbyPubs(current, [
    pub({ id: 2, name: 'Close Cheap', slug: 'close-cheap', lat: -31.953, lng: 115.862, price: 8, regularPrice: 8, effectivePrice: 8 }),
    pub({ id: 3, name: 'Same Suburb Cheap', slug: 'same-suburb-cheap', suburb: 'Perth', lat: -32.1, lng: 116.1, price: 9, regularPrice: 9, effectivePrice: 9 }),
  ])

  assert.deepEqual(ranked.map(item => item.name), ['Close Cheap', 'Same Suburb Cheap'])
})

test('rankNearbyPubs keeps missing and unverified prices eligible', () => {
  const current = pub({ price: null, regularPrice: null, effectivePrice: null })
  const ranked = rankNearbyPubs(current, [
    pub({ id: 2, name: 'Unverified Pub', slug: 'unverified', priceVerified: false, price: 7, regularPrice: 7, effectivePrice: 7, lat: -31.9524, lng: 115.8614 }),
    pub({ id: 3, name: 'Verified Pub', slug: 'verified', suburb: 'Northbridge', lat: -31.946, lng: 115.858, price: 9, regularPrice: 9, effectivePrice: 9 }),
    pub({ id: 4, name: 'Missing Price Pub', slug: 'missing', priceVerified: false, price: null, regularPrice: null, effectivePrice: null, lat: -31.9525, lng: 115.8615 }),
  ])

  assert.deepEqual(ranked.map(item => item.name), ['Unverified Pub', 'Missing Price Pub', 'Verified Pub'])
})

test('rankNearbyPubs excludes a confirmed permanent closure independently of price', () => {
  const current = pub({ price: null, regularPrice: null, effectivePrice: null })
  const ranked = rankNearbyPubs(current, [
    pub({ id: 2, name: 'Closed Cheap Pub', slug: 'closed', businessStatus: 'CLOSED_PERMANENTLY', price: 5, regularPrice: 5, effectivePrice: 5 }),
    pub({ id: 3, name: 'Open TBC Pub', slug: 'open-tbc', priceVerified: false, price: null, regularPrice: null, effectivePrice: null }),
  ])

  assert.deepEqual(ranked.map(item => item.name), ['Open TBC Pub'])
})
