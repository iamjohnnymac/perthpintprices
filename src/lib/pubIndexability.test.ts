import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getPubIndexability } from './pubIndexability'

const NOW = new Date('2026-06-01T12:00:00.000Z')

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

  it('noindexes permanently-closed venues but keeps their data tier for rendering', () => {
    const result = getPubIndexability({
      price: 11.5,
      priceVerified: true,
      lastVerified: '2026-05-31T00:00:00.000Z',
      now: NOW,
      businessStatus: 'CLOSED_PERMANENTLY',
    })

    assert.equal(result.isIndexable, false) // out of index + sitemap
    assert.equal(result.tier, 'A') // tier preserved so the page doesn't show a "no price" stub
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
