import { perthNow } from './perthClock'

// 2026 FIFA World Cup — group-stage fixtures in Perth time (AWST, UTC+8).
// Times cross-checked against two AEST schedule sources on 10 June 2026
// (AWST = AEST − 2h). Knockout kickoffs are TBC until the bracket settles —
// they are deliberately not listed rather than guessed.
export const TIMES_CHECKED = '10 June 2026'

export interface WcFixture {
  id: string
  /** Kickoff in AWST, ISO 8601 with +08:00 offset */
  kickoff: string
  home: string
  away: string
  /** Australia is playing */
  socceroos?: boolean
  /** Group D fixture that affects Australia's path */
  groupD?: boolean
}

export const WC_FIXTURES: WcFixture[] = [
  // Friday 12 June
  { id: '2026-06-12-mexico-south-africa', kickoff: '2026-06-12T03:00:00+08:00', home: 'Mexico', away: 'South Africa' },
  { id: '2026-06-12-south-korea-czech-republic', kickoff: '2026-06-12T10:00:00+08:00', home: 'South Korea', away: 'Czech Republic' },
  // Saturday 13 June
  { id: '2026-06-13-canada-bosnia', kickoff: '2026-06-13T03:00:00+08:00', home: 'Canada', away: 'Bosnia & Herzegovina' },
  { id: '2026-06-13-usa-paraguay', kickoff: '2026-06-13T09:00:00+08:00', home: 'USA', away: 'Paraguay', groupD: true },
  // Sunday 14 June
  { id: '2026-06-14-qatar-switzerland', kickoff: '2026-06-14T03:00:00+08:00', home: 'Qatar', away: 'Switzerland' },
  { id: '2026-06-14-brazil-morocco', kickoff: '2026-06-14T06:00:00+08:00', home: 'Brazil', away: 'Morocco' },
  { id: '2026-06-14-haiti-scotland', kickoff: '2026-06-14T09:00:00+08:00', home: 'Haiti', away: 'Scotland' },
  { id: '2026-06-14-australia-turkiye', kickoff: '2026-06-14T12:00:00+08:00', home: 'Australia', away: 'Türkiye', socceroos: true },
  // Monday 15 June
  { id: '2026-06-15-germany-curacao', kickoff: '2026-06-15T01:00:00+08:00', home: 'Germany', away: 'Curaçao' },
  { id: '2026-06-15-netherlands-japan', kickoff: '2026-06-15T04:00:00+08:00', home: 'Netherlands', away: 'Japan' },
  { id: '2026-06-15-ivory-coast-ecuador', kickoff: '2026-06-15T07:00:00+08:00', home: 'Ivory Coast', away: 'Ecuador' },
  { id: '2026-06-15-sweden-tunisia', kickoff: '2026-06-15T10:00:00+08:00', home: 'Sweden', away: 'Tunisia' },
  // Tuesday 16 June
  { id: '2026-06-16-spain-cape-verde', kickoff: '2026-06-16T00:00:00+08:00', home: 'Spain', away: 'Cape Verde' },
  { id: '2026-06-16-belgium-egypt', kickoff: '2026-06-16T03:00:00+08:00', home: 'Belgium', away: 'Egypt' },
  { id: '2026-06-16-saudi-arabia-uruguay', kickoff: '2026-06-16T06:00:00+08:00', home: 'Saudi Arabia', away: 'Uruguay' },
  { id: '2026-06-16-iran-new-zealand', kickoff: '2026-06-16T09:00:00+08:00', home: 'Iran', away: 'New Zealand' },
  // Wednesday 17 June
  { id: '2026-06-17-france-senegal', kickoff: '2026-06-17T03:00:00+08:00', home: 'France', away: 'Senegal' },
  { id: '2026-06-17-iraq-norway', kickoff: '2026-06-17T06:00:00+08:00', home: 'Iraq', away: 'Norway' },
  { id: '2026-06-17-argentina-algeria', kickoff: '2026-06-17T09:00:00+08:00', home: 'Argentina', away: 'Algeria' },
  { id: '2026-06-17-austria-jordan', kickoff: '2026-06-17T12:00:00+08:00', home: 'Austria', away: 'Jordan' },
  // Thursday 18 June
  { id: '2026-06-18-portugal-dr-congo', kickoff: '2026-06-18T01:00:00+08:00', home: 'Portugal', away: 'DR Congo' },
  { id: '2026-06-18-england-croatia', kickoff: '2026-06-18T04:00:00+08:00', home: 'England', away: 'Croatia' },
  { id: '2026-06-18-ghana-panama', kickoff: '2026-06-18T07:00:00+08:00', home: 'Ghana', away: 'Panama' },
  { id: '2026-06-18-uzbekistan-colombia', kickoff: '2026-06-18T10:00:00+08:00', home: 'Uzbekistan', away: 'Colombia' },
  // Friday 19 June
  { id: '2026-06-19-czech-republic-south-africa', kickoff: '2026-06-19T00:00:00+08:00', home: 'Czech Republic', away: 'South Africa' },
  { id: '2026-06-19-switzerland-bosnia', kickoff: '2026-06-19T03:00:00+08:00', home: 'Switzerland', away: 'Bosnia & Herzegovina' },
  { id: '2026-06-19-canada-qatar', kickoff: '2026-06-19T06:00:00+08:00', home: 'Canada', away: 'Qatar' },
  { id: '2026-06-19-mexico-south-korea', kickoff: '2026-06-19T09:00:00+08:00', home: 'Mexico', away: 'South Korea' },
  // Saturday 20 June
  { id: '2026-06-20-usa-australia', kickoff: '2026-06-20T03:00:00+08:00', home: 'USA', away: 'Australia', socceroos: true },
  { id: '2026-06-20-scotland-morocco', kickoff: '2026-06-20T06:00:00+08:00', home: 'Scotland', away: 'Morocco' },
  { id: '2026-06-20-brazil-haiti', kickoff: '2026-06-20T08:30:00+08:00', home: 'Brazil', away: 'Haiti' },
  { id: '2026-06-20-turkiye-paraguay', kickoff: '2026-06-20T11:00:00+08:00', home: 'Türkiye', away: 'Paraguay', groupD: true },
  // Sunday 21 June
  { id: '2026-06-21-netherlands-sweden', kickoff: '2026-06-21T01:00:00+08:00', home: 'Netherlands', away: 'Sweden' },
  { id: '2026-06-21-germany-ivory-coast', kickoff: '2026-06-21T04:00:00+08:00', home: 'Germany', away: 'Ivory Coast' },
  { id: '2026-06-21-ecuador-curacao', kickoff: '2026-06-21T08:00:00+08:00', home: 'Ecuador', away: 'Curaçao' },
  { id: '2026-06-21-tunisia-japan', kickoff: '2026-06-21T12:00:00+08:00', home: 'Tunisia', away: 'Japan' },
  // Monday 22 June
  { id: '2026-06-22-spain-saudi-arabia', kickoff: '2026-06-22T00:00:00+08:00', home: 'Spain', away: 'Saudi Arabia' },
  { id: '2026-06-22-belgium-iran', kickoff: '2026-06-22T03:00:00+08:00', home: 'Belgium', away: 'Iran' },
  { id: '2026-06-22-uruguay-cape-verde', kickoff: '2026-06-22T06:00:00+08:00', home: 'Uruguay', away: 'Cape Verde' },
  { id: '2026-06-22-new-zealand-egypt', kickoff: '2026-06-22T09:00:00+08:00', home: 'New Zealand', away: 'Egypt' },
  // Tuesday 23 June
  { id: '2026-06-23-argentina-austria', kickoff: '2026-06-23T01:00:00+08:00', home: 'Argentina', away: 'Austria' },
  { id: '2026-06-23-france-iraq', kickoff: '2026-06-23T05:00:00+08:00', home: 'France', away: 'Iraq' },
  { id: '2026-06-23-norway-senegal', kickoff: '2026-06-23T08:00:00+08:00', home: 'Norway', away: 'Senegal' },
  { id: '2026-06-23-jordan-algeria', kickoff: '2026-06-23T11:00:00+08:00', home: 'Jordan', away: 'Algeria' },
  // Wednesday 24 June
  { id: '2026-06-24-portugal-uzbekistan', kickoff: '2026-06-24T01:00:00+08:00', home: 'Portugal', away: 'Uzbekistan' },
  { id: '2026-06-24-england-ghana', kickoff: '2026-06-24T04:00:00+08:00', home: 'England', away: 'Ghana' },
  { id: '2026-06-24-panama-croatia', kickoff: '2026-06-24T07:00:00+08:00', home: 'Panama', away: 'Croatia' },
  { id: '2026-06-24-colombia-dr-congo', kickoff: '2026-06-24T10:00:00+08:00', home: 'Colombia', away: 'DR Congo' },
  // Thursday 25 June
  { id: '2026-06-25-switzerland-canada', kickoff: '2026-06-25T03:00:00+08:00', home: 'Switzerland', away: 'Canada' },
  { id: '2026-06-25-bosnia-qatar', kickoff: '2026-06-25T03:00:00+08:00', home: 'Bosnia & Herzegovina', away: 'Qatar' },
  { id: '2026-06-25-scotland-brazil', kickoff: '2026-06-25T06:00:00+08:00', home: 'Scotland', away: 'Brazil' },
  { id: '2026-06-25-morocco-haiti', kickoff: '2026-06-25T06:00:00+08:00', home: 'Morocco', away: 'Haiti' },
  { id: '2026-06-25-south-africa-south-korea', kickoff: '2026-06-25T09:00:00+08:00', home: 'South Africa', away: 'South Korea' },
  { id: '2026-06-25-czech-republic-mexico', kickoff: '2026-06-25T09:00:00+08:00', home: 'Czech Republic', away: 'Mexico' },
  // Friday 26 June
  { id: '2026-06-26-curacao-ivory-coast', kickoff: '2026-06-26T04:00:00+08:00', home: 'Curaçao', away: 'Ivory Coast' },
  { id: '2026-06-26-ecuador-germany', kickoff: '2026-06-26T04:00:00+08:00', home: 'Ecuador', away: 'Germany' },
  { id: '2026-06-26-tunisia-netherlands', kickoff: '2026-06-26T07:00:00+08:00', home: 'Tunisia', away: 'Netherlands' },
  { id: '2026-06-26-japan-sweden', kickoff: '2026-06-26T07:00:00+08:00', home: 'Japan', away: 'Sweden' },
  { id: '2026-06-26-paraguay-australia', kickoff: '2026-06-26T10:00:00+08:00', home: 'Paraguay', away: 'Australia', socceroos: true },
  { id: '2026-06-26-turkiye-usa', kickoff: '2026-06-26T10:00:00+08:00', home: 'Türkiye', away: 'USA', groupD: true },
  // Saturday 27 June
  { id: '2026-06-27-norway-france', kickoff: '2026-06-27T03:00:00+08:00', home: 'Norway', away: 'France' },
  { id: '2026-06-27-senegal-iraq', kickoff: '2026-06-27T03:00:00+08:00', home: 'Senegal', away: 'Iraq' },
  { id: '2026-06-27-uruguay-spain', kickoff: '2026-06-27T08:00:00+08:00', home: 'Uruguay', away: 'Spain' },
  { id: '2026-06-27-cape-verde-saudi-arabia', kickoff: '2026-06-27T08:00:00+08:00', home: 'Cape Verde', away: 'Saudi Arabia' },
  { id: '2026-06-27-egypt-iran', kickoff: '2026-06-27T11:00:00+08:00', home: 'Egypt', away: 'Iran' },
  { id: '2026-06-27-new-zealand-belgium', kickoff: '2026-06-27T11:00:00+08:00', home: 'New Zealand', away: 'Belgium' },
  // Sunday 28 June
  { id: '2026-06-28-croatia-ghana', kickoff: '2026-06-28T05:00:00+08:00', home: 'Croatia', away: 'Ghana' },
  { id: '2026-06-28-panama-england', kickoff: '2026-06-28T05:00:00+08:00', home: 'Panama', away: 'England' },
  { id: '2026-06-28-colombia-portugal', kickoff: '2026-06-28T07:30:00+08:00', home: 'Colombia', away: 'Portugal' },
  { id: '2026-06-28-dr-congo-uzbekistan', kickoff: '2026-06-28T07:30:00+08:00', home: 'DR Congo', away: 'Uzbekistan' },
  { id: '2026-06-28-jordan-argentina', kickoff: '2026-06-28T10:00:00+08:00', home: 'Jordan', away: 'Argentina' },
  { id: '2026-06-28-algeria-austria', kickoff: '2026-06-28T10:00:00+08:00', home: 'Algeria', away: 'Austria' },
]

// --- WA licensing windows -------------------------------------------------
// Standard hotel/tavern/small bar hours: 6am–midnight Mon–Sat, 10am–midnight
// Sunday (DLGSC licence types & trading hours, checked 10 June 2026).
// For matches outside those hours, venues need the World Cup extended
// trading permit announced by the Director of Liquor Licensing on
// 5 June 2026 (trade until 30 min after full-time while the broadcast runs).

export type TradingStatus = 'permit' | 'early' | 'normal'

export interface TradingBadge {
  label: string
  detail: string
}

export const TRADING_BADGES: Record<TradingStatus, TradingBadge> = {
  permit: {
    label: 'Permit hours',
    detail: 'Outside standard trading — only venues holding a World Cup extended trading permit can pour.',
  },
  early: {
    label: 'Early doors',
    detail: 'Legal from 6am on a standard licence — but earlier than most pubs open, so check doors.',
  },
  normal: {
    label: 'Normal trading',
    detail: 'Inside standard hours for any licensed venue. Screens, not licensing, decide where to go.',
  },
}

/** Classify a kickoff against WA standard trading hours. */
export function tradingStatus(kickoffIso: string): TradingStatus {
  const perth = perthNow(new Date(kickoffIso))
  const minutes = perth.minutesOfDay
  const sunday = perth.dayOfWeek === 0
  if (minutes < 6 * 60) return 'permit'
  if (sunday && minutes < 10 * 60) return 'permit'
  if (minutes < 9 * 60) return 'early'
  return 'normal'
}

// --- Formatting helpers ---------------------------------------------------

/** "midnight", "midday", "3am", "8.30am" */
export function formatKickoff(kickoffIso: string): string {
  const minutes = perthNow(new Date(kickoffIso)).minutesOfDay
  if (minutes === 0) return 'midnight'
  if (minutes === 12 * 60) return 'midday'
  const h24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = h24 < 12 ? 'am' : 'pm'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return mins === 0 ? `${h12}${suffix}` : `${h12}.${String(mins).padStart(2, '0')}${suffix}`
}

/** Perth calendar date of the kickoff, "2026-06-14" */
export function fixtureDay(kickoffIso: string): string {
  return perthNow(new Date(kickoffIso)).ymd
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Friday 12 June" from a Perth ymd string */
export function formatDayHeading(ymd: string): string {
  const perth = perthNow(new Date(`${ymd}T00:00:00+08:00`))
  const [, month, day] = ymd.split('-').map(Number)
  return `${DAY_NAMES[perth.dayOfWeek]} ${day} ${MONTH_NAMES[month - 1]}`
}

// --- Live state -----------------------------------------------------------

export type MatchPhase = 'upcoming' | 'live' | 'played'

const MATCH_RUNTIME_MS = 120 * 60 * 1000

export function matchPhase(fixture: WcFixture, now: Date): MatchPhase {
  const kickoff = new Date(fixture.kickoff).getTime()
  const t = now.getTime()
  if (t < kickoff) return 'upcoming'
  if (t < kickoff + MATCH_RUNTIME_MS) return 'live'
  return 'played'
}

// --- Confirmed openings ---------------------------------------------------
// A venue lands here only once its opening time for a specific match is
// confirmed — with the date we checked. No guesses: an empty list renders
// as an honest empty state, not filler.

export interface ConfirmedOpening {
  /** Slug in our pubs table, when we track the venue */
  pubSlug?: string
  venue: string
  suburb: string
  fixtureId: string
  /** e.g. "Doors 2.30am" */
  doors: string
  /** Date we confirmed it, e.g. "10 June 2026" */
  confirmedAt: string
  source: 'venue call' | 'venue post' | 'reader report'
}

export const CONFIRMED_OPENINGS: ConfirmedOpening[] = []

// --- Form guide -----------------------------------------------------------
// Venues with form for showing sport (and the ones the directories list),
// mapped to our pub pages so prices and freshness ride along. This is form,
// not confirmation — the confirmed list above is the real thing.

export const FORM_GUIDE_SLUGS: string[] = [
  'rosie-ogradys',
  'the-brass-monkey',
  'varsity-northbridge',
  'durty-nellys-irish-pub',
  'the-globe',
  'the-generous-squire',
  'the-lucky-shag',
  'the-camfield',
  'crown-sports-bar',
  'the-royal-on-the-waterfront',
  'brewdog-perth',
  'j-b-oreillys',
  'paddington-ale-house',
  'victoria-park-hotel',
]
