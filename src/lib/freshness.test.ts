import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getPriceRecency } from './freshness'

const NOW = new Date('2026-06-01T12:00:00.000Z')

describe('getPriceRecency', () => {
  it('marks prices checked within 30 days as fresh', () => {
    const result = getPriceRecency('2026-05-03T12:00:00.000Z', NOW)

    assert.equal(result.tier, 'fresh')
    assert.equal(result.daysAgo, 29)
    assert.equal(result.label, 'Checked 29d ago')
  })

  it('marks prices from 30 to 90 days old as aging', () => {
    assert.equal(getPriceRecency('2026-05-02T12:00:00.000Z', NOW).tier, 'aging')
    assert.equal(getPriceRecency('2026-03-03T12:00:00.000Z', NOW).tier, 'aging')
  })

  it('marks prices older than 90 days as stale', () => {
    const result = getPriceRecency('2026-03-02T12:00:00.000Z', NOW)

    assert.equal(result.tier, 'stale')
    assert.equal(result.daysAgo, 91)
    assert.equal(result.label, 'Checked 91d ago')
  })

  it('marks missing or invalid verification dates as unknown', () => {
    assert.equal(getPriceRecency(null, NOW).tier, 'unknown')
    assert.equal(getPriceRecency(null, NOW).label, 'Not checked yet')
    assert.equal(getPriceRecency('not-a-date', NOW).tier, 'unknown')
  })

  it('uses everyday labels for same-day and yesterday checks', () => {
    assert.equal(getPriceRecency('2026-06-01T00:00:00.000Z', NOW).label, 'Checked today')
    assert.equal(getPriceRecency('2026-05-31T12:00:00.000Z', NOW).label, 'Checked yesterday')
  })
})
