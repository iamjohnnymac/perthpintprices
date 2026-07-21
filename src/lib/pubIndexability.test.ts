import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getPubIndexability } from './pubIndexability'

const NOW = new Date('2026-06-01T12:00:00.000Z')

describe('getPubIndexability', () => {
  it('indexes NAP-only pub pages', () => {
    const result = getPubIndexability({
      price: null,
      happyHour: null,
      happyHourPrice: null,
    })

    assert.equal(result.tier, 'C')
    assert.equal(result.isIndexable, true)
  })

  it('indexes pubs with a price even when other data is sparse', () => {
    const result = getPubIndexability({
      price: 12,
      priceVerified: false,
      lastVerified: null,
    })

    assert.equal(result.tier, 'B')
    assert.equal(result.isIndexable, true)
  })

  it('keeps every price trust and freshness state indexable', () => {
    const cases = [
      {
        label: 'fresh',
        pub: { price: 12, priceVerified: true, lastVerified: '2026-05-31T00:00:00.000Z' },
      },
      {
        label: 'aging',
        pub: { price: 12, priceVerified: true, lastVerified: '2026-04-15T00:00:00.000Z' },
      },
      {
        label: 'stale',
        pub: { price: 12, priceVerified: true, lastVerified: '2026-01-01T00:00:00.000Z' },
      },
      {
        label: 'missing verification date',
        pub: { price: 12, priceVerified: true, lastVerified: null },
      },
      {
        label: 'unverified price',
        pub: { price: 12, priceVerified: false, lastVerified: '2026-05-31T00:00:00.000Z' },
      },
      {
        label: 'missing price',
        pub: { price: null, priceVerified: false, lastVerified: null },
      },
    ] as const

    for (const { label, pub } of cases) {
      assert.equal(getPubIndexability({ ...pub, now: NOW }).isIndexable, true, label)
    }
  })

  it('promotes verified priced pubs to Tier A', () => {
    const result = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-05-31T00:00:00.000Z',
      now: NOW,
    })

    assert.equal(result.tier, 'A')
    assert.equal(result.isIndexable, true)
  })

  it('demotes stale verified prices to Tier B', () => {
    const result = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-03-02T00:00:00.000Z',
      now: NOW,
    })

    assert.equal(result.tier, 'B')
    assert.equal(result.isIndexable, true)
  })

  it('scores fresh prices above stale prices', () => {
    const fresh = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-05-31T00:00:00.000Z',
      now: NOW,
    })
    const stale = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-03-02T00:00:00.000Z',
      now: NOW,
    })

    assert.equal(fresh.dataScore, 4)
    assert.equal(stale.dataScore, 2)
  })

  it('keeps the permanent-closure exception separate from price quality', () => {
    const priced = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-05-31T00:00:00.000Z',
      now: NOW,
      businessStatus: 'CLOSED_PERMANENTLY',
    })
    const missingPrice = getPubIndexability({
      price: null,
      priceVerified: false,
      lastVerified: null,
      businessStatus: 'CLOSED_PERMANENTLY',
    })

    assert.equal(priced.isIndexable, false)
    assert.equal(priced.tier, 'A')
    assert.equal(missingPrice.isIndexable, false)
    assert.equal(missingPrice.tier, 'C')
  })

  it('indexes happy-hour pubs without a regular price', () => {
    const result = getPubIndexability({
      price: null,
      happyHour: 'Mon-Fri 5-6pm',
      vibeTag: 'sports bar',
    })

    assert.equal(result.tier, 'A')
    assert.equal(result.isIndexable, true)
  })
})
