import assert from 'node:assert/strict'
import test from 'node:test'
import type { Pub } from '@/types/pub'
import { prepareDiscoverPubs } from './discoverPubs'

function pub(overrides: Partial<Pub>): Pub {
  return {
    id: 1,
    slug: 'open-pub',
    name: 'Open Pub',
    address: '',
    suburb: 'Perth',
    lat: -31.9523,
    lng: 115.8613,
    price: null,
    regularPrice: null,
    effectivePrice: null,
    beerType: '',
    happyHour: null,
    website: null,
    description: null,
    priceSource: null,
    priceVerifiedAt: null,
    priceConfidence: null,
    priceVerified: false,
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
    businessStatus: 'OPERATIONAL',
    ...overrides,
  }
}

test('prepareDiscoverPubs filters invalid canonical destinations before slimming', () => {
  const prepared = prepareDiscoverPubs([
    pub({ id: 1, slug: 'missing-price', price: null, priceVerified: false }),
    pub({ id: 2, slug: 'unverified-price', price: 8, regularPrice: 8, effectivePrice: 8, priceVerified: false }),
    pub({ id: 3, slug: 'closed-cheap', price: 5, regularPrice: 5, effectivePrice: 5, priceVerified: true, businessStatus: 'CLOSED_PERMANENTLY' }),
    pub({ id: 4, slug: '', price: 6, regularPrice: 6, effectivePrice: 6, priceVerified: true }),
  ])

  assert.deepEqual(prepared.map(item => item.slug), ['missing-price', 'unverified-price'])
  assert.equal('businessStatus' in prepared[0], false)
})
