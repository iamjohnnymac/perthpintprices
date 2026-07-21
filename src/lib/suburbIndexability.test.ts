import assert from 'node:assert/strict'
import test from 'node:test'
import { getSuburbIndexability } from './suburbIndexability'
import { getAllSuburbs, getSuburbPubs } from './supabase'
import type { Pub } from '@/types/pub'

function makePub(overrides: Partial<Pub> = {}): Pub {
  return {
    id: 1,
    slug: 'test-pub',
    name: 'Test Pub',
    address: '1 Test Street',
    suburb: 'Testville',
    lat: -31.95,
    lng: 115.86,
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
    cozyPub: false,
    businessStatus: 'OPERATIONAL',
    ...overrides,
  }
}

test('a suburb with zero legitimate venues is not indexable', () => {
  assert.equal(getSuburbIndexability({ legitimatePubCount: 0 }).isIndexable, false)
})

test('a one-pub TBC suburb is indexable and keeps its venue link', async () => {
  const pub = makePub({ slug: 'one-tbc' })
  const [suburb] = await getAllSuburbs([pub])
  const listed = await getSuburbPubs('Testville', [pub])

  assert.equal(getSuburbIndexability({ legitimatePubCount: suburb.pubCount }).isIndexable, true)
  assert.deepEqual(listed.map(item => item.slug), ['one-tbc'])
})

test('mixed verified and unverified venues stay together in an indexable suburb', async () => {
  const pubs = [
    makePub({ id: 1, slug: 'checked', price: 10, regularPrice: 10, effectivePrice: 10, priceVerified: true }),
    makePub({ id: 2, slug: 'tbc', priceVerified: false }),
  ]
  const [suburb] = await getAllSuburbs(pubs)
  const listed = await getSuburbPubs('Testville', pubs)

  assert.equal(getSuburbIndexability({ legitimatePubCount: suburb.pubCount }).isIndexable, true)
  assert.deepEqual(listed.map(item => item.slug).sort(), ['checked', 'tbc'])
})

test('venue coverage, not price data, is the qualifying criterion', () => {
  assert.equal(getSuburbIndexability({ legitimatePubCount: 3 }).isIndexable, true)
})

test('confirmed closures do not create an indexable suburb or pub link', async () => {
  const closed = makePub({ slug: 'closed', businessStatus: 'CLOSED_PERMANENTLY' })
  const suburbs = await getAllSuburbs([closed])
  const listed = await getSuburbPubs('Testville', [closed])

  assert.deepEqual(suburbs, [])
  assert.deepEqual(listed, [])
  assert.equal(getSuburbIndexability({ legitimatePubCount: listed.length }).isIndexable, false)
})
