import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// @ts-expect-error TS5097: Node's native TypeScript test runner requires the explicit .ts extension.
import { groupPubsBySuburb } from './utils.ts'
import type { Pub } from '../types/pub'

const makePub = (overrides: Partial<Pub> = {}): Pub => ({
  id: 1,
  slug: 'test-pub',
  name: 'Test Pub',
  address: '1 Test Street',
  suburb: 'Fremantle',
  lat: -32.0569,
  lng: 115.7439,
  price: 12,
  beerType: 'Lager',
  happyHour: null,
  website: null,
  description: null,
  priceVerified: true,
  hasTab: false,
  kidFriendly: false,
  happyHourPrice: null,
  happyHourDays: null,
  happyHourStart: null,
  happyHourEnd: null,
  lastVerified: null,
  regularPrice: 12,
  isHappyHourNow: false,
  happyHourLabel: null,
  happyHourMinutesRemaining: null,
  imageUrl: null,
  vibeTag: null,
  cozyPub: false,
  effectivePrice: 12,
  ...overrides,
})

describe('groupPubsBySuburb', () => {
  it('returns an empty object for an empty array', () => {
    assert.deepEqual(groupPubsBySuburb([]), {})
  })

  it('groups a single pub by suburb', () => {
    const pub = makePub({ suburb: 'Fremantle' })

    assert.deepEqual(groupPubsBySuburb([pub]), {
      Fremantle: [pub],
    })
  })

  it('groups three pubs across two suburbs', () => {
    const fremantlePub = makePub({ id: 1, slug: 'fremantle-pub', suburb: 'Fremantle' })
    const subiacoPub = makePub({ id: 2, slug: 'subiaco-pub', suburb: 'Subiaco' })
    const anotherFremantlePub = makePub({
      id: 3,
      slug: 'another-fremantle-pub',
      suburb: 'Fremantle',
    })

    assert.deepEqual(
      groupPubsBySuburb([fremantlePub, subiacoPub, anotherFremantlePub]),
      {
        Fremantle: [fremantlePub, anotherFremantlePub],
        Subiaco: [subiacoPub],
      },
    )
  })

  it('treats mixed-case suburb names case-sensitively', () => {
    const upperCasePub = makePub({ id: 1, slug: 'fremantle-title-case', suburb: 'Fremantle' })
    const lowerCasePub = makePub({ id: 2, slug: 'fremantle-lower-case', suburb: 'fremantle' })

    assert.deepEqual(groupPubsBySuburb([upperCasePub, lowerCasePub]), {
      Fremantle: [upperCasePub],
      fremantle: [lowerCasePub],
    })
  })
})
