import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { toHomePub } from './homePub'
import type { Pub } from '@/types/pub'

describe('homepage pub payload', () => {
  it('keeps only fields used by homepage filters, stats, and rows', () => {
    const source = {
      id: 1,
      slug: 'test-pub',
      name: 'Test Pub',
      address: '1 Test Street',
      suburb: 'Perth',
      lat: -31.95,
      lng: 115.86,
      price: 10,
      beerType: 'Lager',
      happyHour: null,
      description: 'Test description',
      priceVerified: true,
      kidFriendly: false,
      hasTab: true,
      lastVerified: '2026-07-20T00:00:00.000Z',
      regularPrice: 10,
      isHappyHourNow: false,
      vibeTag: 'local',
      googleOpeningHours: { weekdayDescriptions: ['Monday: Open 24 hours'] },
      website: 'https://example.com',
    } as Pub

    const result = toHomePub(source)

    assert.deepEqual(Object.keys(result).sort(), [
      'address', 'beerType', 'description', 'happyHour', 'hasTab', 'id',
      'isHappyHourNow', 'kidFriendly', 'lastVerified', 'lat', 'lng', 'name',
      'price', 'priceVerified', 'regularPrice', 'slug', 'suburb', 'vibeTag',
    ].sort())
    assert.equal('googleOpeningHours' in result, false)
    assert.equal('website' in result, false)
  })
})
