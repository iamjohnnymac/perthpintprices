import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  WC_FIXTURES,
  tradingStatus,
  formatKickoff,
  formatCountdown,
  fixtureDay,
  formatDayHeading,
  matchPhase,
  type WcFixture,
} from './worldCup'

describe('WC_FIXTURES data sanity', () => {
  it('contains the full 72-match group stage', () => {
    assert.equal(WC_FIXTURES.length, 72)
  })

  it('has unique ids', () => {
    const ids = new Set(WC_FIXTURES.map(f => f.id))
    assert.equal(ids.size, WC_FIXTURES.length)
  })

  it('every kickoff parses and carries the AWST offset', () => {
    for (const f of WC_FIXTURES) {
      assert.ok(!Number.isNaN(new Date(f.kickoff).getTime()), `${f.id} kickoff parses`)
      assert.ok(f.kickoff.endsWith('+08:00'), `${f.id} kickoff is AWST`)
    }
  })

  it('all fixtures land 12-28 June 2026 in Perth', () => {
    for (const f of WC_FIXTURES) {
      const day = fixtureDay(f.kickoff)
      assert.ok(day >= '2026-06-12' && day <= '2026-06-28', `${f.id} on ${day}`)
    }
  })

  it('every kickoff lands between midnight and midday AWST', () => {
    for (const f of WC_FIXTURES) {
      const label = formatKickoff(f.kickoff)
      assert.ok(!label.endsWith('pm') || label === 'midday' || false, `${f.id} kicks off at ${label}`)
    }
  })

  it('has exactly three Socceroos fixtures at the verified times', () => {
    const socceroos = WC_FIXTURES.filter(f => f.socceroos)
    assert.equal(socceroos.length, 3)
    assert.deepEqual(
      socceroos.map(f => [f.id, f.kickoff]),
      [
        ['2026-06-14-australia-turkiye', '2026-06-14T12:00:00+08:00'],
        ['2026-06-20-usa-australia', '2026-06-20T03:00:00+08:00'],
        ['2026-06-26-paraguay-australia', '2026-06-26T10:00:00+08:00'],
      ],
    )
  })

  it('marks the three non-Australia Group D fixtures', () => {
    const groupD = WC_FIXTURES.filter(f => f.groupD)
    assert.equal(groupD.length, 3)
    assert.ok(groupD.every(f => !f.socceroos))
  })
})

describe('tradingStatus', () => {
  it('before 6am needs the permit, any day', () => {
    assert.equal(tradingStatus('2026-06-20T03:00:00+08:00'), 'permit') // Saturday 3am
    assert.equal(tradingStatus('2026-06-16T00:00:00+08:00'), 'permit') // Tuesday midnight
    assert.equal(tradingStatus('2026-06-23T05:00:00+08:00'), 'permit') // Tuesday 5am
  })

  it('Sunday before 10am needs the permit even after 6am', () => {
    assert.equal(tradingStatus('2026-06-14T06:00:00+08:00'), 'permit') // Sunday 6am
    assert.equal(tradingStatus('2026-06-14T09:00:00+08:00'), 'permit') // Sunday 9am
    assert.equal(tradingStatus('2026-06-28T07:30:00+08:00'), 'permit') // Sunday 7.30am
  })

  it('Sunday from 10am is normal trading', () => {
    assert.equal(tradingStatus('2026-06-28T10:00:00+08:00'), 'normal')
    assert.equal(tradingStatus('2026-06-14T12:00:00+08:00'), 'normal')
  })

  it('6am-9am Mon-Sat is early doors (legal, but check the venue opens)', () => {
    assert.equal(tradingStatus('2026-06-19T06:00:00+08:00'), 'early') // Friday 6am
    assert.equal(tradingStatus('2026-06-20T08:30:00+08:00'), 'early') // Saturday 8.30am
  })

  it('9am onwards Mon-Sat is normal trading', () => {
    assert.equal(tradingStatus('2026-06-13T09:00:00+08:00'), 'normal') // Saturday 9am
    assert.equal(tradingStatus('2026-06-17T12:00:00+08:00'), 'normal') // Wednesday midday
  })
})

describe('formatKickoff', () => {
  it('uses midnight and midday for the edges', () => {
    assert.equal(formatKickoff('2026-06-16T00:00:00+08:00'), 'midnight')
    assert.equal(formatKickoff('2026-06-14T12:00:00+08:00'), 'midday')
  })

  it('formats whole and half hours without trailing zeros', () => {
    assert.equal(formatKickoff('2026-06-20T03:00:00+08:00'), '3am')
    assert.equal(formatKickoff('2026-06-20T08:30:00+08:00'), '8.30am')
    assert.equal(formatKickoff('2026-06-27T11:00:00+08:00'), '11am')
    assert.equal(formatKickoff('2026-06-28T07:30:00+08:00'), '7.30am')
  })
})

describe('formatDayHeading', () => {
  it('renders the Perth weekday and date', () => {
    assert.equal(formatDayHeading('2026-06-12'), 'Friday 12 June')
    assert.equal(formatDayHeading('2026-06-14'), 'Sunday 14 June')
    assert.equal(formatDayHeading('2026-06-28'), 'Sunday 28 June')
  })
})

describe('formatCountdown', () => {
  const SEC = 1000
  const MIN = 60 * SEC
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR

  it('shows only seconds inside a minute', () => {
    assert.equal(formatCountdown(42 * SEC), '42s')
  })

  it('shows minutes and padded seconds inside an hour', () => {
    assert.equal(formatCountdown(5 * MIN + 3 * SEC), '5m 03s')
  })

  it('shows hours, minutes and seconds inside a day', () => {
    assert.equal(formatCountdown(3 * HOUR + 5 * MIN + 9 * SEC), '3h 05m 09s')
  })

  it('drops the ticking seconds beyond a day', () => {
    assert.equal(formatCountdown(2 * DAY + 4 * HOUR + 32 * MIN + 50 * SEC), '2d 4h 32m')
  })

  it('clamps passed kickoffs to zero', () => {
    assert.equal(formatCountdown(0), '0s')
    assert.equal(formatCountdown(-5 * MIN), '0s')
  })
})

describe('matchPhase', () => {
  const fixture: WcFixture = {
    id: 'test',
    kickoff: '2026-06-20T03:00:00+08:00',
    home: 'USA',
    away: 'Australia',
  }

  it('is upcoming before kickoff', () => {
    assert.equal(matchPhase(fixture, new Date('2026-06-20T02:59:00+08:00')), 'upcoming')
  })

  it('is live from kickoff until two hours in', () => {
    assert.equal(matchPhase(fixture, new Date('2026-06-20T03:00:00+08:00')), 'live')
    assert.equal(matchPhase(fixture, new Date('2026-06-20T04:59:00+08:00')), 'live')
  })

  it('is played after the two-hour window', () => {
    assert.equal(matchPhase(fixture, new Date('2026-06-20T05:00:00+08:00')), 'played')
  })
})
