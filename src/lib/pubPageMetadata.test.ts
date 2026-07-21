import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Pub } from '@/types/pub'
import { buildPubPageMetadata } from '@/app/[suburb]/[pub]/pubMetadata'

const NOW = new Date('2026-07-21T00:00:00.000Z')

function makePub(overrides: Partial<Pub> = {}): Pub {
  return {
    id: 1,
    slug: 'the-test-pub',
    name: 'The Test Pub',
    address: '1 Test Street',
    suburb: 'Fremantle',
    lat: -32.0569,
    lng: 115.7439,
    price: 12,
    regularPrice: 12,
    effectivePrice: 12,
    beerType: 'Lager',
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
    lastVerified: '2026-07-20T00:00:00.000Z',
    isHappyHourNow: false,
    happyHourLabel: null,
    happyHourMinutesRemaining: null,
    imageUrl: null,
    vibeTag: null,
    ...overrides,
  }
}

describe('pub page metadata indexability', () => {
  const legitimateCases: Array<{ label: string; pub: Pub }> = [
    { label: 'fresh', pub: makePub() },
    { label: 'aging', pub: makePub({ lastVerified: '2026-06-01T00:00:00.000Z' }) },
    { label: 'stale', pub: makePub({ lastVerified: '2026-01-01T00:00:00.000Z' }) },
    { label: 'missing verification date', pub: makePub({ lastVerified: null }) },
    {
      label: 'missing price',
      pub: makePub({ price: null, regularPrice: null, effectivePrice: null, priceVerified: false, lastVerified: null }),
    },
    { label: 'unverified price', pub: makePub({ priceVerified: false }) },
  ]

  for (const { label, pub } of legitimateCases) {
    it(`keeps the ${label} pub indexable and self-canonical`, () => {
      const metadata = buildPubPageMetadata(pub, 12, NOW)

      assert.deepEqual(metadata.robots, { index: true, follow: true })
      assert.equal(metadata.alternates?.canonical, `https://perthpintprices.com/fremantle/${pub.slug}`)
    })
  }

  it('noindexes a confirmed permanent closure without changing its canonical', () => {
    const pub = makePub({ businessStatus: 'CLOSED_PERMANENTLY' })
    const metadata = buildPubPageMetadata(pub, 12, NOW)

    assert.deepEqual(metadata.robots, { index: false, follow: true })
    assert.equal(metadata.alternates?.canonical, 'https://perthpintprices.com/fremantle/the-test-pub')
  })
})
