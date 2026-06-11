import assert from 'node:assert/strict'
import test from 'node:test'
import {
  expiresAtFrom,
  formatClockLabel,
  formatMeetTimeLabel,
  formatTimeLeft,
  isExpired,
  isMeetAtInWindow,
  MEET_AT_MAX_AHEAD_MS,
  MEET_AT_PAST_GRACE_MS,
  shortPubName,
  SIGNAL_TTL_MS,
} from './signals'

test('expiresAtFrom adds exactly 3 hours to the meet time', () => {
  const meetAt = new Date('2026-06-10T10:00:00.000Z')
  assert.equal(expiresAtFrom(meetAt).toISOString(), '2026-06-10T13:00:00.000Z')
  assert.equal(SIGNAL_TTL_MS, 3 * 60 * 60 * 1000)
})

test('isExpired flips exactly at expires_at', () => {
  const signal = { expires_at: '2026-06-10T13:00:00.000Z' }
  // One millisecond before expiry: still alive.
  assert.equal(isExpired(signal, new Date('2026-06-10T12:59:59.999Z')), false)
  // At the boundary: burned out.
  assert.equal(isExpired(signal, new Date('2026-06-10T13:00:00.000Z')), true)
  // After: burned out.
  assert.equal(isExpired(signal, new Date('2026-06-10T13:00:00.001Z')), true)
})

test('isExpired treats unparseable expiry data as expired', () => {
  assert.equal(isExpired({ expires_at: 'not-a-date' }), true)
  assert.equal(isExpired({ expires_at: '' }), true)
})

test('isMeetAtInWindow allows now-15min through now+36h inclusive', () => {
  const now = new Date('2026-06-10T08:00:00.000Z')
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs)

  assert.equal(isMeetAtInWindow(at(0), now), true)
  // Past grace boundary.
  assert.equal(isMeetAtInWindow(at(-MEET_AT_PAST_GRACE_MS), now), true)
  assert.equal(isMeetAtInWindow(at(-MEET_AT_PAST_GRACE_MS - 1), now), false)
  // Future boundary.
  assert.equal(isMeetAtInWindow(at(MEET_AT_MAX_AHEAD_MS), now), true)
  assert.equal(isMeetAtInWindow(at(MEET_AT_MAX_AHEAD_MS + 1), now), false)
  // Garbage dates never pass.
  assert.equal(isMeetAtInWindow(new Date('nope'), now), false)
})

test('formatMeetTimeLabel renders Perth wall-clock time', () => {
  // 10:00 UTC = 6pm Perth (UTC+8, no DST).
  assert.equal(formatMeetTimeLabel('2026-06-10T10:00:00.000Z'), '6pm')
  // 09:30 UTC = 5.30pm Perth.
  assert.equal(formatMeetTimeLabel('2026-06-10T09:30:00.000Z'), '5.30pm')
  // 04:00 UTC = 12pm Perth (noon, not 0pm).
  assert.equal(formatMeetTimeLabel('2026-06-10T04:00:00.000Z'), '12pm')
  // 16:00 UTC = 12am Perth (midnight rollover to next day).
  assert.equal(formatMeetTimeLabel('2026-06-10T16:00:00.000Z'), '12am')
  assert.equal(formatMeetTimeLabel('garbage'), '')
})

test('formatClockLabel converts 24h DB times to short labels', () => {
  assert.equal(formatClockLabel('18:00'), '6pm')
  assert.equal(formatClockLabel('18:00:00'), '6pm')
  assert.equal(formatClockLabel('17:30'), '5.30pm')
  assert.equal(formatClockLabel('09:00'), '9am')
  assert.equal(formatClockLabel('00:00'), '12am')
  assert.equal(formatClockLabel('12:00'), '12pm')
  assert.equal(formatClockLabel('25:00'), null)
  assert.equal(formatClockLabel(''), null)
  assert.equal(formatClockLabel(null), null)
  assert.equal(formatClockLabel(undefined), null)
})

test('shortPubName strips "The" and generic suffixes without emptying the name', () => {
  assert.equal(shortPubName('The Norfolk Hotel'), 'Norfolk')
  assert.equal(shortPubName('The National Hotel'), 'National')
  assert.equal(shortPubName('Dunsborough Tavern'), 'Dunsborough')
  // Never strip down to nothing.
  assert.equal(shortPubName('The Tavern'), 'Tavern')
  assert.equal(shortPubName('Hotel'), 'Hotel')
  // Non-suffix names pass through.
  assert.equal(shortPubName('Bar Orient'), 'Bar Orient')
  assert.equal(shortPubName('Little Creatures'), 'Little Creatures')
})

test('formatTimeLeft renders hours and zero-padded minutes, clamped at zero', () => {
  assert.equal(formatTimeLeft(2 * 3600 * 1000 + 55 * 60 * 1000), '2h 55m left')
  assert.equal(formatTimeLeft(5 * 60 * 1000), '0h 05m left')
  assert.equal(formatTimeLeft(0), '0h 00m left')
  assert.equal(formatTimeLeft(-5000), '0h 00m left')
})
