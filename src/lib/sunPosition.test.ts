import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getPerthSunTimes, parsePerthLocalTime } from './sunPosition'

const perthTime = (date: Date) =>
  date.toLocaleString('en-AU', { timeZone: 'Australia/Perth', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: false })

function withTimezones<T>(zones: string[], run: () => T): T[] {
  const original = process.env.TZ
  try {
    return zones.map(zone => {
      process.env.TZ = zone
      return run()
    })
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

describe('getPerthSunTimes', () => {
  it("returns Perth's sunrise and sunset for the Perth calendar day", () => {
    // 12:30pm AWST on 26 Sep 2026. Open-Meteo gives 06:01 and 18:15 that day.
    // This offline fallback ignores the equation of time (about 9 minutes in
    // late September), so allow a quarter of an hour either way.
    const { sunrise, sunset, goldenHourStart } = getPerthSunTimes(new Date('2026-09-26T04:30:00Z'))
    const minutes = (date: Date) => (date.getTime() - Date.parse('2026-09-26T00:00:00+08:00')) / 60000
    assert.ok(Math.abs(minutes(sunrise) - (6 * 60 + 1)) <= 15, `sunrise ${perthTime(sunrise)}`)
    assert.ok(Math.abs(minutes(sunset) - (18 * 60 + 15)) <= 15, `sunset ${perthTime(sunset)}`)
    assert.equal(sunset.getTime() - goldenHourStart.getTime(), 60 * 60 * 1000)
  })

  it('uses the Perth date, not the UTC date, just after Perth midnight', () => {
    // 1am AWST on 27 Sep is still 26 Sep in UTC.
    const { sunrise } = getPerthSunTimes(new Date('2026-09-26T17:00:00Z'))
    assert.match(perthTime(sunrise), /^27 Sept?/)
  })

  it('gives identical instants whatever the host timezone', () => {
    const instant = new Date('2026-09-26T04:30:00Z')
    const results = withTimezones(['Australia/Perth', 'UTC', 'America/Los_Angeles', 'Asia/Tokyo'], () => {
      const { sunrise, sunset, goldenHourStart } = getPerthSunTimes(instant)
      return [sunrise.getTime(), sunset.getTime(), goldenHourStart.getTime()]
    })
    for (const result of results) assert.deepEqual(result, results[0])
  })
})

describe('parsePerthLocalTime', () => {
  it('reads an Open-Meteo local time as Perth time in any host timezone', () => {
    const results = withTimezones(['Australia/Perth', 'UTC', 'America/Los_Angeles'], () =>
      parsePerthLocalTime('2026-09-26T18:15').toISOString()
    )
    for (const result of results) assert.equal(result, '2026-09-26T10:15:00.000Z')
  })
})
