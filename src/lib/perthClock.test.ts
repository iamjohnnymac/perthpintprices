import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { perthNow, perthToday } from './perthClock'

// These assertions use fixed UTC instants and read only the structured fields,
// so they pass identically under any host timezone. That is the regression that
// guards against the "double-shift" bug (deriving Perth time with local getters
// off an already-shifted Date). To prove host-independence in CI, run the suite
// under two timezones, e.g. `TZ=Australia/Perth npm test` and
// `TZ=America/New_York npm test` — both must produce these same results.

describe('perthNow', () => {
  it('converts a UTC instant to Perth wall-clock (UTC+8)', () => {
    // 2026-01-15 10:00Z  ->  Perth +8  ->  18:00 same day (Thursday)
    const p = perthNow(new Date('2026-01-15T10:00:00.000Z'))
    assert.equal(p.ymd, '2026-01-15')
    assert.equal(p.minutesOfDay, 18 * 60)
    assert.equal(p.dayOfWeek, 4) // Thursday
  })

  it('wraps the day forward when +8h crosses midnight UTC', () => {
    // 2026-01-15 20:00Z  ->  Perth +8  ->  04:00 next day (Friday, Jan 16)
    const p = perthNow(new Date('2026-01-15T20:00:00.000Z'))
    assert.equal(p.ymd, '2026-01-16')
    assert.equal(p.minutesOfDay, 4 * 60)
    assert.equal(p.dayOfWeek, 5) // Friday
  })

  it('handles the midnight boundary and month rollover', () => {
    // 2026-06-30 16:30Z  ->  Perth +8  ->  00:30 on 2026-07-01
    const p = perthNow(new Date('2026-06-30T16:30:00.000Z'))
    assert.equal(p.ymd, '2026-07-01')
    assert.equal(p.minutesOfDay, 30)
  })

  it('defaults to the live clock when called with no argument', () => {
    const p = perthNow()
    assert.ok(p.dayOfWeek >= 0 && p.dayOfWeek <= 6)
    assert.ok(p.minutesOfDay >= 0 && p.minutesOfDay < 24 * 60)
    assert.match(p.ymd, /^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('perthToday', () => {
  it('returns the Perth calendar date for an instant', () => {
    // 2026-03-01 17:00Z  ->  Perth +8  ->  01:00 on 2026-03-02
    assert.equal(perthToday(new Date('2026-03-01T17:00:00.000Z')), '2026-03-02')
  })
})

describe('host-timezone independence', () => {
  it('produces identical fields regardless of the host TZ (proves no double-shift)', () => {
    // Node re-reads process.env.TZ for Date operations created after it changes,
    // so flipping it here exercises the exact host-dependent path the dropped
    // `.date` field used to expose (issue #58) — within a single test run.
    const instant = new Date('2026-01-15T20:00:00.000Z')
    const original = process.env.TZ
    try {
      process.env.TZ = 'America/New_York' // UTC-5
      const east = perthNow(instant)
      process.env.TZ = 'Australia/Perth' // UTC+8
      const perth = perthNow(instant)
      process.env.TZ = 'UTC'
      const utc = perthNow(instant)
      assert.deepEqual(east, perth)
      assert.deepEqual(perth, utc)
      assert.equal(perth.ymd, '2026-01-16')
      assert.equal(perth.minutesOfDay, 4 * 60)
    } finally {
      if (original === undefined) delete process.env.TZ
      else process.env.TZ = original
    }
  })
})
