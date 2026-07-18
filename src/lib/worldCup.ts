import { perthNow } from './perthClock'

// 2026 FIFA World Cup — fixtures in Perth time (AWST, UTC+8).
// Group-stage times cross-checked against two AEST schedule sources on
// 10 June 2026 (AWST = AEST − 2h). Knockout kickoffs (Round of 32 → final)
// added 17 June 2026, cross-checked against the official schedule. Knockout
// teams were updated from FIFA's official fixture feed on 19 July 2026.
export const TIMES_CHECKED = '19 July 2026'

// Perth calendar date of the final. The final kicks off 3am AWST on 20 July
// 2026 (7pm 19 July US Eastern), so World Cup surfaces render up to and
// including this Perth day, then retire themselves.
export const WC_LAST_DAY = '2026-07-20'

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
  /** Knockout round label, e.g. "Round of 32". Absent for group fixtures. */
  round?: string
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

  // --- Round of 32 ---
  // Monday 29 June
  { id: '2026-06-29-r32-m73', kickoff: '2026-06-29T03:00:00+08:00', home: 'South Africa', away: 'Canada', round: 'Round of 32' },
  // Tuesday 30 June
  { id: '2026-06-30-r32-m76', kickoff: '2026-06-30T01:00:00+08:00', home: 'Brazil', away: 'Japan', round: 'Round of 32' },
  { id: '2026-06-30-r32-m74', kickoff: '2026-06-30T04:30:00+08:00', home: 'Germany', away: 'Paraguay', round: 'Round of 32' },
  { id: '2026-06-30-r32-m75', kickoff: '2026-06-30T09:00:00+08:00', home: 'Netherlands', away: 'Morocco', round: 'Round of 32' },
  // Wednesday 1 July
  { id: '2026-07-01-r32-m78', kickoff: '2026-07-01T01:00:00+08:00', home: 'Ivory Coast', away: 'Norway', round: 'Round of 32' },
  { id: '2026-07-01-r32-m77', kickoff: '2026-07-01T05:00:00+08:00', home: 'France', away: 'Sweden', round: 'Round of 32' },
  { id: '2026-07-01-r32-m79', kickoff: '2026-07-01T10:00:00+08:00', home: 'Mexico', away: 'Ecuador', round: 'Round of 32' },
  // Thursday 2 July
  { id: '2026-07-02-r32-m80', kickoff: '2026-07-02T00:00:00+08:00', home: 'England', away: 'DR Congo', round: 'Round of 32' },
  { id: '2026-07-02-r32-m82', kickoff: '2026-07-02T04:00:00+08:00', home: 'Belgium', away: 'Senegal', round: 'Round of 32' },
  { id: '2026-07-02-r32-m81', kickoff: '2026-07-02T08:00:00+08:00', home: 'USA', away: 'Bosnia & Herzegovina', round: 'Round of 32' },
  // Friday 3 July
  { id: '2026-07-03-r32-m84', kickoff: '2026-07-03T03:00:00+08:00', home: 'Spain', away: 'Austria', round: 'Round of 32' },
  { id: '2026-07-03-r32-m83', kickoff: '2026-07-03T07:00:00+08:00', home: 'Portugal', away: 'Croatia', round: 'Round of 32' },
  { id: '2026-07-03-r32-m85', kickoff: '2026-07-03T11:00:00+08:00', home: 'Switzerland', away: 'Algeria', round: 'Round of 32' },
  // Saturday 4 July
  { id: '2026-07-04-r32-m88', kickoff: '2026-07-04T02:00:00+08:00', home: 'Australia', away: 'Egypt', round: 'Round of 32' },
  { id: '2026-07-04-r32-m86', kickoff: '2026-07-04T06:00:00+08:00', home: 'Argentina', away: 'Cape Verde', round: 'Round of 32' },
  { id: '2026-07-04-r32-m87', kickoff: '2026-07-04T09:30:00+08:00', home: 'Colombia', away: 'Ghana', round: 'Round of 32' },

  // --- Round of 16 ---
  // Sunday 5 July
  { id: '2026-07-05-r16-m90', kickoff: '2026-07-05T01:00:00+08:00', home: 'Canada', away: 'Morocco', round: 'Round of 16' },
  { id: '2026-07-05-r16-m89', kickoff: '2026-07-05T05:00:00+08:00', home: 'Paraguay', away: 'France', round: 'Round of 16' },
  // Monday 6 July
  { id: '2026-07-06-r16-m91', kickoff: '2026-07-06T04:00:00+08:00', home: 'Brazil', away: 'Norway', round: 'Round of 16' },
  { id: '2026-07-06-r16-m92', kickoff: '2026-07-06T08:00:00+08:00', home: 'Mexico', away: 'England', round: 'Round of 16' },
  // Tuesday 7 July
  { id: '2026-07-07-r16-m93', kickoff: '2026-07-07T03:00:00+08:00', home: 'Portugal', away: 'Spain', round: 'Round of 16' },
  { id: '2026-07-07-r16-m94', kickoff: '2026-07-07T08:00:00+08:00', home: 'USA', away: 'Belgium', round: 'Round of 16' },
  // Wednesday 8 July
  { id: '2026-07-08-r16-m95', kickoff: '2026-07-08T00:00:00+08:00', home: 'Argentina', away: 'Egypt', round: 'Round of 16' },
  { id: '2026-07-08-r16-m96', kickoff: '2026-07-08T04:00:00+08:00', home: 'Switzerland', away: 'Colombia', round: 'Round of 16' },

  // --- Quarter-finals ---
  // Friday 10 July
  { id: '2026-07-10-qf-m97', kickoff: '2026-07-10T04:00:00+08:00', home: 'France', away: 'Morocco', round: 'Quarter-final' },
  // Saturday 11 July
  { id: '2026-07-11-qf-m98', kickoff: '2026-07-11T03:00:00+08:00', home: 'Spain', away: 'Belgium', round: 'Quarter-final' },
  // Sunday 12 July
  { id: '2026-07-12-qf-m99', kickoff: '2026-07-12T05:00:00+08:00', home: 'Norway', away: 'England', round: 'Quarter-final' },
  { id: '2026-07-12-qf-m100', kickoff: '2026-07-12T09:00:00+08:00', home: 'Argentina', away: 'Switzerland', round: 'Quarter-final' },

  // --- Semi-finals ---
  // Wednesday 15 July
  { id: '2026-07-15-sf-m101', kickoff: '2026-07-15T03:00:00+08:00', home: 'France', away: 'Spain', round: 'Semi-final' },
  // Thursday 16 July
  { id: '2026-07-16-sf-m102', kickoff: '2026-07-16T03:00:00+08:00', home: 'England', away: 'Argentina', round: 'Semi-final' },

  // --- Third-place play-off ---
  // Sunday 19 July
  { id: '2026-07-19-third-m103', kickoff: '2026-07-19T05:00:00+08:00', home: 'France', away: 'England', round: 'Third-place play-off' },

  // --- Final ---
  // Monday 20 July (3am AWST)
  { id: '2026-07-20-final-m104', kickoff: '2026-07-20T03:00:00+08:00', home: 'Spain', away: 'Argentina', round: 'Final' },
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

/** "12am", "12pm", "3am", "8.30am" */
export function formatKickoff(kickoffIso: string): string {
  const minutes = perthNow(new Date(kickoffIso)).minutesOfDay
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

/**
 * Countdown text for a kickoff. Seconds tick only inside the final day —
 * "9d 14h 32m" further out, "14h 32m 08s" inside a day, "32m 08s" inside
 * an hour. Zero or negative means kickoff has passed.
 */
export function formatCountdown(msUntil: number): string {
  const total = Math.max(0, Math.floor(msUntil / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days > 0) return `${days}d ${hours}h ${pad(minutes)}m`
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`
  return `${seconds}s`
}

export type MatchPhase = 'upcoming' | 'live' | 'played'

const MATCH_RUNTIME_MS = 120 * 60 * 1000

export function matchPhase(fixture: WcFixture, now: Date): MatchPhase {
  const kickoff = new Date(fixture.kickoff).getTime()
  const t = now.getTime()
  if (t < kickoff) return 'upcoming'
  if (t < kickoff + MATCH_RUNTIME_MS) return 'live'
  return 'played'
}

export function upcomingFixtures(now: Date, limit = 3): WcFixture[] {
  return WC_FIXTURES
    .filter(fixture => matchPhase(fixture, now) === 'upcoming')
    .slice(0, limit)
}

// --- Team colours ----------------------------------------------------------
// Flag colours (top-to-bottom stripes) for every qualified team in the
// fixture list — drives the stripe bands on fixture cards and the flag chips
// in the fixture rows. Unknown teams fall back to a neutral stripe so a
// missing entry never breaks a card.

export const TEAM_COLOURS: Record<string, string[]> = {
  Algeria: ['#006233', '#FFFFFF', '#D21034'],
  Argentina: ['#74ACDF', '#FFFFFF', '#74ACDF'],
  Australia: ['#FFCD00', '#00843D'],
  Austria: ['#ED2939', '#FFFFFF', '#ED2939'],
  Belgium: ['#000000', '#FDDA24', '#EF3340'],
  'Bosnia & Herzegovina': ['#002395', '#FECB00', '#002395'],
  Brazil: ['#009C3B', '#FFDF00', '#002776'],
  Canada: ['#FF0000', '#FFFFFF', '#FF0000'],
  'Cape Verde': ['#003893', '#FFFFFF', '#CF2027'],
  Colombia: ['#FCD116', '#003893', '#CE1126'],
  Croatia: ['#FF0000', '#FFFFFF', '#171796'],
  'Curaçao': ['#002B7F', '#F9E814', '#002B7F'],
  'Czech Republic': ['#FFFFFF', '#D7141A', '#11457E'],
  'DR Congo': ['#007FFF', '#F7D618', '#CE1021'],
  Ecuador: ['#FFDD00', '#034EA2', '#ED1C24'],
  Egypt: ['#CE1126', '#FFFFFF', '#000000'],
  England: ['#FFFFFF', '#CE1124', '#FFFFFF'],
  France: ['#0055A4', '#FFFFFF', '#EF4135'],
  Germany: ['#000000', '#DD0000', '#FFCE00'],
  Ghana: ['#CE1126', '#FCD116', '#006B3F'],
  Haiti: ['#00209F', '#D21034'],
  Iran: ['#239F40', '#FFFFFF', '#DA0000'],
  Iraq: ['#CE1126', '#FFFFFF', '#000000'],
  'Ivory Coast': ['#FF8200', '#FFFFFF', '#009A44'],
  Japan: ['#FFFFFF', '#BC002D', '#FFFFFF'],
  Jordan: ['#000000', '#FFFFFF', '#007A3D'],
  Mexico: ['#006847', '#FFFFFF', '#CE1126'],
  Morocco: ['#C1272D', '#006233'],
  Netherlands: ['#AE1C28', '#FFFFFF', '#21468B'],
  'New Zealand': ['#00247D', '#CC142B'],
  Norway: ['#BA0C2F', '#FFFFFF', '#00205B'],
  Panama: ['#DA121A', '#FFFFFF', '#072357'],
  Paraguay: ['#D52B1E', '#FFFFFF', '#0038A8'],
  Portugal: ['#046A38', '#DA291C'],
  Qatar: ['#8A1538', '#FFFFFF'],
  'Saudi Arabia': ['#006C35', '#FFFFFF'],
  Scotland: ['#005EB8', '#FFFFFF', '#005EB8'],
  Senegal: ['#00853F', '#FDEF42', '#E31B23'],
  'South Africa': ['#E03C31', '#007749', '#001489'],
  'South Korea': ['#FFFFFF', '#CD2E3A', '#0047A0'],
  Spain: ['#AA151B', '#F1BF00', '#AA151B'],
  Sweden: ['#006AA7', '#FECC02', '#006AA7'],
  Switzerland: ['#DA291C', '#FFFFFF', '#DA291C'],
  'Türkiye': ['#E30A17', '#FFFFFF'],
  Tunisia: ['#E70013', '#FFFFFF', '#E70013'],
  USA: ['#041E42', '#FFFFFF', '#BF0D3E'],
  Uruguay: ['#0038A8', '#FFFFFF', '#0038A8'],
  Uzbekistan: ['#0099B5', '#FFFFFF', '#1EB53A'],
}

export function teamColours(team: string): string[] {
  return TEAM_COLOURS[team] ?? ['#8A8A85']
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
