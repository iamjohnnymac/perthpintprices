import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { GF_AREAS, GF_BOUNCE, GF_LIVE_SITES, GF_VENUES, grandFinalPhase, timeToBounce } from './grandFinal'

describe('2026 Grand Final timing', () => {
  it('bounces at 12:30pm Perth time', () => {
    assert.equal(new Date(GF_BOUNCE).toLocaleTimeString('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', minute: '2-digit' }), '12:30 pm')
  })

  it('moves from countdown to live to after, then hides the next Perth day', () => {
    assert.equal(grandFinalPhase(new Date('2026-09-26T02:00:00Z')), 'pre')
    assert.equal(timeToBounce(new Date('2026-09-26T02:48:00Z')), '1h 42m')
    assert.equal(timeToBounce(new Date('2026-09-26T04:22:00Z')), '8m')
    assert.equal(grandFinalPhase(new Date('2026-09-26T05:00:00Z')), 'live')
    assert.equal(timeToBounce(new Date('2026-09-26T05:00:00Z')), null)
    assert.equal(grandFinalPhase(new Date('2026-09-26T09:00:00Z')), 'after')
    // 11:59pm AWST is still Grand Final day; 12:01am AWST is not.
    assert.equal(grandFinalPhase(new Date('2026-09-26T15:59:00Z')), 'after')
    assert.equal(grandFinalPhase(new Date('2026-09-26T16:01:00Z')), 'over')
  })
})

describe('Grand Final venue list', () => {
  it('gives every entry a public source and a known area', () => {
    for (const entry of [...GF_VENUES, ...GF_LIVE_SITES]) {
      assert.match(entry.sourceUrl, /^https:\/\//, `${entry.name} needs an https source`)
      assert.ok(entry.sourceLabel, `${entry.name} needs a source label`)
      assert.ok(entry.offer.length > 20, `${entry.name} needs an offer`)
    }
    for (const venue of GF_VENUES) {
      assert.ok(GF_AREAS.includes(venue.area), `${venue.name} has an unknown area`)
    }
  })

  it('lists each venue once', () => {
    const keys = GF_VENUES.map(venue => `${venue.name}|${venue.suburb}`)
    assert.equal(new Set(keys).size, keys.length)
  })
})
