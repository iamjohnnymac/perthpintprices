/**
 * Pint Signal — shared types + pure helpers.
 *
 * One mate lights the signal (pub + time), the crew answers via the share
 * link, and the signal burns out 3 hours after the meet time. Everything
 * here is pure and clock-injected so the API routes and pages stay
 * deterministic and testable. Schema: scripts/pint-signal-schema.sql.
 */
import { perthNow } from './perthClock'

// ── Types (mirror the signals / signal_answers tables) ──────────────────────

export interface Signal {
  id: string
  pub_slug: string
  crew_name: string | null
  lit_by: string
  meet_at: string
  expires_at: string
  created_at: string
}

export type SignalAnswerValue = 'in' | 'out'

export interface SignalAnswer {
  id: string
  signal_id: string
  name: string
  answer: SignalAnswerValue
  note: string | null
  created_at: string
}

// ── Lifetime ─────────────────────────────────────────────────────────────────

/** Signals burn out 3 hours after the meet time. */
export const SIGNAL_TTL_MS = 3 * 60 * 60 * 1000

/** How far in the past a meet time may be when lighting ("Now" with clock skew). */
export const MEET_AT_PAST_GRACE_MS = 15 * 60 * 1000

/** How far ahead a signal can be lit — tonight or tomorrow, not next month. */
export const MEET_AT_MAX_AHEAD_MS = 36 * 60 * 60 * 1000

/** expires_at for a given meet time: meet_at + 3h. */
export function expiresAtFrom(meetAt: Date): Date {
  return new Date(meetAt.getTime() + SIGNAL_TTL_MS)
}

/**
 * A signal is expired once `now` reaches expires_at. Unparseable or missing
 * expiry data counts as expired — a signal that can't prove it's alive is dead.
 */
export function isExpired(signal: Pick<Signal, 'expires_at'>, now: Date = new Date()): boolean {
  const expires = new Date(signal.expires_at).getTime()
  if (!Number.isFinite(expires)) return true
  return now.getTime() >= expires
}

/** Is a proposed meet time inside the allowed lighting window? (Inclusive bounds.) */
export function isMeetAtInWindow(meetAt: Date, now: Date = new Date()): boolean {
  const t = meetAt.getTime()
  if (!Number.isFinite(t)) return false
  return t >= now.getTime() - MEET_AT_PAST_GRACE_MS && t <= now.getTime() + MEET_AT_MAX_AHEAD_MS
}

// ── Formatters ───────────────────────────────────────────────────────────────

function clockLabel(hours24: number, minutes: number): string {
  const h12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const ampm = hours24 < 12 ? 'am' : 'pm'
  return minutes === 0 ? `${h12}${ampm}` : `${h12}.${String(minutes).padStart(2, '0')}${ampm}`
}

/** Perth wall-clock label for a meet instant: "6pm", "6.30pm", "12pm". */
export function formatMeetTimeLabel(meetAt: string | Date): string {
  const date = typeof meetAt === 'string' ? new Date(meetAt) : meetAt
  if (!Number.isFinite(date.getTime())) return ''
  const perth = perthNow(date)
  return clockLabel(Math.floor(perth.minutesOfDay / 60), perth.minutesOfDay % 60)
}

/** "18:00" / "18:00:00" -> "6pm"; null when the string doesn't parse. */
export function formatClockLabel(time: string | null | undefined): string | null {
  if (!time) return null
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  if (hours > 23 || minutes > 59) return null
  return clockLabel(hours, minutes)
}

const PUB_NAME_SUFFIXES = new Set(['hotel', 'tavern', 'pub', 'inn', 'bar'])

/**
 * Short headline name for the signal card: "The Norfolk Hotel" -> "Norfolk".
 * Strips a leading "The" and a single generic suffix word, but never shortens
 * a name down to nothing.
 */
export function shortPubName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return name.trim()
  let start = 0
  let end = words.length
  if (words.length > 1 && words[0].toLowerCase() === 'the') start = 1
  if (end - start > 1 && PUB_NAME_SUFFIXES.has(words[end - 1].toLowerCase())) end -= 1
  const short = words.slice(start, end).join(' ')
  return short || name.trim()
}

/** Burn-bar label: "2h 55m left" (minutes zero-padded, clamps at zero). */
export function formatTimeLeft(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m left`
}
