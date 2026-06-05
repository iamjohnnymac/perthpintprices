// Per-state voice strings for the pub-page modules, in the PPP dry register
// (docs/brand-voice-brief.md + content-pack-v1.md §7). Pure builders: data in,
// rendered string out. Every builder returns a truthful-absence value (null, or
// the verification stub) when the data isn't there — never an invented price,
// window, or blurb. The pub-page MODULE structure/order is owned by
// docs/pub-page-content-plan.md; this file supplies only the words.
//
// Anti-sameness across the ~850 templated pages comes from seededVariant: the
// mini-FAQ question phrasings are seeded by pub id, so the same pub always reads
// the same way but no two pubs share an identical question string.

import { seededVariant } from './seededVariant'

function money(n: number): string {
  return `$${n.toFixed(2)}`
}

/** "$2.00 under" / "$1.50 over" / "about" — the suburb-average delta phrase. */
function deltaPhrase(price: number, suburbAvg: number): { over: boolean; under: boolean; amount: string } {
  const d = price - suburbAvg
  return { over: d >= 0.5, under: d <= -0.5, amount: money(Math.abs(d)) }
}

// ─── H1 / subtitle ───
// Title only promises what the data supports (plan §5). Subtitle folds in the
// one real vibeTag when present.
export function pubH1(pub: string, hasPriceOrHH: boolean): string {
  return hasPriceOrHH ? `${pub} — pint prices & happy hour` : pub
}

export function pubSubtitle(suburb: string, vibeTag: string | null): string | null {
  if (!vibeTag) return null
  return `${vibeTag} in ${suburb}.`
}

// ─── Module 1: Answer block (price + vs-suburb-average + freshness) ───
export interface AnswerBlockData {
  pub: string
  suburb: string
  price: number | null
  suburbAvg: number | null
  checkedDate: string | null
}
export function answerBlock(d: AnswerBlockData): string | null {
  if (d.price == null) return null
  const checked = d.checkedDate ? ` Checked ${d.checkedDate}.` : ''
  if (d.suburbAvg != null && d.suburbAvg > 0) {
    const { over, under, amount } = deltaPhrase(d.price, d.suburbAvg)
    if (under) return `${money(d.price)} a pint at ${d.pub} — ${amount} under the ${d.suburb} average.${checked}`
    if (over) return `${money(d.price)} a pint at ${d.pub}. That's ${amount} over the ${d.suburb} average, if you're counting.${checked}`
    return `${money(d.price)} a pint at ${d.pub} — about the ${d.suburb} average.${checked}`
  }
  return `${money(d.price)} a pint at ${d.pub}.${checked}`
}

// ─── Module 2: Best time to go ───
export interface BestTimeData {
  price: number | null
  hhActiveNow: boolean
  hhLaterToday: boolean
  hhStart: string | null
  hhEnd: string | null
  hhPrice: number | null
  saving: number | null
}
export function bestTime(d: BestTimeData): string | null {
  if (d.hhActiveNow && d.hhEnd && d.hhPrice != null) {
    const saving = d.saving != null && d.saving > 0 ? ` (${money(d.saving)} off the usual)` : ''
    return `Best time is right now — happy hour runs til ${d.hhEnd}, pints at ${money(d.hhPrice)}${saving}.`
  }
  if (d.hhLaterToday && d.hhStart && d.hhEnd && d.hhPrice != null) {
    return `Cheapest window today: ${d.hhStart}–${d.hhEnd}, pints drop to ${money(d.hhPrice)}.`
  }
  if (d.price != null) {
    return `No happy hour we've confirmed here. The price is the price: ${money(d.price)}.`
  }
  return null
}

// ─── Module 3: Cheaper nearby (geo-radius) ───
export interface NearbyPub {
  name: string
  price: number
  distance: string
}
export function cheaperNearby(pub: string, found: NearbyPub[], radius = '1km'): string {
  if (found.length > 0) {
    const list = found.slice(0, 2).map(n => `${n.name} (${money(n.price)}, ${n.distance} away)`).join(', ')
    return `Cheaper within walking distance: ${list}.`
  }
  return `Nothing cheaper we've verified within ${radius}. ${pub} is the local low.`
}

// ─── Module 4: Mini-FAQ (seeded variant pool; render only at >= 3 real answers) ───
const FAQ_QUESTION_POOLS = {
  price: ['How much is a pint at {Pub}?', "What's a pint cost at {Pub}?"],
  happyHour: ['Does {Pub} have a happy hour?', "When's happy hour at {Pub}?"],
  nearby: ['Anywhere cheaper near {Pub}?', 'Cheaper pint near {Pub}?'],
} as const

export type FaqKind = keyof typeof FAQ_QUESTION_POOLS

/** Deterministic question phrasing, seeded by pub id so no two pages share a string. */
export function faqQuestion(kind: FaqKind, pubId: string, pub: string): string {
  return seededVariant(`${pubId}:${kind}`, FAQ_QUESTION_POOLS[kind]).replace('{Pub}', pub)
}

export function faqPriceAnswer(d: AnswerBlockData): string | null {
  if (d.price == null) return null
  const dateClause = d.checkedDate ? ` as of ${d.checkedDate}` : ''
  if (d.suburbAvg != null && d.suburbAvg > 0) {
    const { over, under, amount } = deltaPhrase(d.price, d.suburbAvg)
    const rel = under ? `${amount} under` : over ? `${amount} over` : 'about'
    return `A pint at ${d.pub} is ${money(d.price)}${dateClause} — ${rel} the ${d.suburb} average.`
  }
  return `A pint at ${d.pub} is ${money(d.price)}${dateClause}.`
}

export function faqHappyHourAnswer(d: {
  pub: string
  days: string | null
  start: string | null
  end: string | null
  hhPrice: number | null
  nearbyPub?: string | null
  nearbyDays?: string | null
}): string | null {
  if (d.days && d.start && d.end && d.hhPrice != null) {
    return `${d.pub}'s happy hour runs ${d.days} ${d.start}–${d.end}, pints down to ${money(d.hhPrice)}.`
  }
  if (d.nearbyPub && d.nearbyDays) {
    return `No happy hour we've confirmed. ${d.nearbyPub} nearby runs one ${d.nearbyDays}.`
  }
  return null
}

export function faqNearbyAnswer(d: { cheaperPub: string; distance: string; price: number; delta: number } | null): string | null {
  if (!d) return null
  return `${d.cheaperPub}, ${d.distance} away, has a pint at ${money(d.price)} — ${money(Math.abs(d.delta))} less.`
}

// ─── Module 5: Verification stub (Tier-C / price-less pages) ───
export interface VerificationStubData {
  lastAndrewCall: string | null
  nearbyCount: number
  nearestPub: string | null
  nearestPrice: number | null
}
export function verificationStub(d: VerificationStubData): string {
  const lastCall = d.lastAndrewCall ?? 'never'
  if (d.nearbyCount > 0 && d.nearestPub && d.nearestPrice != null) {
    return `No verified price here yet. Last Andrew call: ${lastCall}. ${d.nearbyCount} nearby ${d.nearbyCount === 1 ? 'pub has' : 'pubs have'} a checked price — start with ${d.nearestPub} at ${money(d.nearestPrice)} →`
  }
  return `No verified price here yet. Last Andrew call: ${lastCall}. Know it? Add it →`
}

// ─── Pub meta description ───
// Price-delta / HH window / nearest-cheaper clause carries the uniqueness — no
// constant boilerplate suffix (plan §5 de-dup rule).
export interface PubMetaData {
  pub: string
  suburb: string
  price: number | null
  suburbAvg: number | null
  checkedDate: string | null
  hhClause?: string | null
  nearbyCheaperClause?: string | null
  hhPrice?: number | null
  hhWindow?: string | null
}
export function pubMetaDescription(d: PubMetaData): string {
  if (d.price == null) {
    if (d.hhPrice != null && d.hhPrice > 0) {
      const window = d.hhWindow ? ` (${d.hhWindow})` : ''
      return `${d.pub} pours a ${money(d.hhPrice)} pint during happy hour${window} in ${d.suburb}. Standard price not confirmed yet.`
    }
    const tail = d.nearbyCheaperClause ? ` ${d.nearbyCheaperClause}` : ''
    return `No verified pint price at ${d.pub} in ${d.suburb} yet.${tail}`.trim()
  }
  let rel = ''
  if (d.suburbAvg != null && d.suburbAvg > 0) {
    const { over, under, amount } = deltaPhrase(d.price, d.suburbAvg)
    rel = under ? ` (${amount} under the ${d.suburb} average)` : over ? ` (${amount} over the ${d.suburb} average)` : ` (about the ${d.suburb} average)`
  }
  const checked = d.checkedDate ? `, checked ${d.checkedDate}` : ''
  const tail = d.hhClause || d.nearbyCheaperClause || ''
  return `${d.pub} pours a ${money(d.price)} pint${rel}${checked}.${tail ? ' ' + tail : ''}`.trim()
}
