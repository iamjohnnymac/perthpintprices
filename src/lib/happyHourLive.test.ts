import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getHappyHourStatus } from './happyHourLive'

describe('getHappyHourStatus', () => {
  it('activates weekend happy hours with half-hour boundaries', () => {
    const status = getHappyHourStatus({
      price: 12,
      happyHourPrice: 9,
      happyHourDays: '{Sat,Sun}',
      happyHourStart: '16:30:00',
      happyHourEnd: '18:00:00',
    }, new Date('2026-01-03T09:00:00.000Z'))

    assert.equal(status.isActive, true)
    assert.equal(status.isToday, true)
    assert.equal(status.effectivePrice, 9)
    assert.equal(status.startsInMinutes, null)
    assert.equal(status.minutesRemaining, 60)
    assert.equal(status.countdown, '1h 0m left')
    assert.equal(status.happyHourLabel, 'Weekends 4:30pm-6pm')
  })

  it('marks single-day am-to-pm happy hours as starting soon today', () => {
    const status = getHappyHourStatus({
      price: 13,
      happyHourPrice: 10,
      happyHourDays: 'Friday',
      happyHourStart: '11:00:00',
      happyHourEnd: '13:00:00',
    }, new Date('2026-01-02T02:15:00.000Z'))

    assert.equal(status.isActive, false)
    assert.equal(status.isToday, true)
    assert.equal(status.effectivePrice, 13)
    assert.equal(status.startsInMinutes, 45)
    assert.equal(status.minutesRemaining, null)
    assert.equal(status.countdown, 'in 45m')
    assert.equal(status.happyHourLabel, 'Friday 11am-1pm')
  })

  it('does not mark already-ended same-day happy hours as starting soon', () => {
    const status = getHappyHourStatus({
      price: 13,
      happyHourPrice: 10,
      happyHourDays: 'Friday',
      happyHourStart: '11:00:00',
      happyHourEnd: '13:00:00',
    }, new Date('2026-01-02T10:30:00.000Z'))

    assert.equal(status.isActive, false)
    assert.equal(status.isToday, false)
    assert.equal(status.effectivePrice, 13)
    assert.equal(status.startsInMinutes, null)
    assert.equal(status.minutesRemaining, null)
    assert.equal(status.countdown, null)
  })
})
