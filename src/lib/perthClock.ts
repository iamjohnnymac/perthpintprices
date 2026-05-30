/**
 * PerthClock — the single source of "now in Perth" (AWST, UTC+8, no DST).
 *
 * This is the keystone for all time-dependent logic in the app. Every module
 * that reasons about the current time should take a `now: Date` parameter and
 * derive its Perth calendar fields from here, so it becomes deterministic and
 * unit-testable with an injected clock.
 *
 * IMPLEMENTATION INVARIANT: the calendar fields are derived from ABSOLUTE UTC
 * (shift the instant by +8h, then read via getUTC*). We deliberately do NOT
 * read local getters (getHours/getDay) off a shifted Date — that double-shifts
 * on a non-UTC host. Because only getUTC* is used here, the result is identical
 * regardless of the machine's timezone (Perth users run UTC+8, not UTC).
 */

const PERTH_OFFSET_MS = 8 * 60 * 60 * 1000 // UTC+8, fixed (Western Australia has no DST)

export interface PerthNow {
  /**
   * A Date whose UTC fields read as Perth wall-clock time.
   * Prefer the structured fields below; if you must read this Date, use getUTC*.
   */
  date: Date
  /** Day of week in Perth: 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number
  /** Minutes since Perth midnight, 0..1439. */
  minutesOfDay: number
  /** Perth calendar date as `YYYY-MM-DD`. */
  ymd: string
}

/** Resolve the current Perth wall-clock fields for a given instant. */
export function perthNow(now: Date = new Date()): PerthNow {
  const shifted = new Date(now.getTime() + PERTH_OFFSET_MS)
  return {
    date: shifted,
    dayOfWeek: shifted.getUTCDay(),
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    ymd: shifted.toISOString().slice(0, 10),
  }
}

/** The Perth calendar date (`YYYY-MM-DD`) for a given instant. */
export function perthToday(now: Date = new Date()): string {
  return perthNow(now).ymd
}
