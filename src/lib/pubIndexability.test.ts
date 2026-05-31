import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getPubIndexability } from './pubIndexability'

describe('getPubIndexability', () => {
  it('noindexes NAP-only pub pages', () => {
    const result = getPubIndexability({
      price: null,
      happyHour: null,
      happyHourPrice: null,
    })

    assert.equal(result.tier, 'C')
    assert.equal(result.isIndexable, false)
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

  it('promotes verified priced pubs to Tier A', () => {
    const result = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-05-31T00:00:00.000Z',
    })

    assert.equal(result.tier, 'A')
    assert.equal(result.isIndexable, true)
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
