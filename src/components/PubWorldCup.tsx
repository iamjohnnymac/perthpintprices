import Link from 'next/link'
import { Tv, ArrowUpRight } from 'lucide-react'
import WorldCupCountdown from '@/components/WorldCupCountdown'
import {
  WC_FIXTURES,
  WC_LAST_DAY,
  TRADING_BADGES,
  teamColours,
  tradingStatus,
  formatKickoff,
  fixtureDay,
  formatDayHeading,
  matchPhase,
  type TradingStatus,
} from '@/lib/worldCup'
import { perthToday } from '@/lib/perthClock'

// How many upcoming kickoffs to surface on a pub page. Three keeps the card
// to the next day or two without turning into the full schedule (that's the
// hub at /world-cup).
const UPCOMING_COUNT = 3

const STATUS_CHIP_CLASSES: Record<TradingStatus, string> = {
  permit: 'bg-white text-amber border-2 border-amber',
  early: 'bg-white text-ink border-2 border-ink/30',
  normal: 'bg-off-white text-gray-mid border-2 border-ink/10',
}

// Team name glued to a tiny stacked-stripe flag. Bracket slots ("Winner A")
// fall back to a neutral stripe via teamColours, so knockout rows still read.
function TeamName({ team }: { team: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="flex h-[11px] w-[17px] shrink-0 flex-col overflow-hidden rounded-[2px] border border-ink/30">
        {teamColours(team).map((colour, i) => (
          <span key={i} className="w-full flex-1" style={{ backgroundColor: colour }} />
        ))}
      </span>
      {team}
    </span>
  )
}

/**
 * World Cup kickoffs card for a pub page. Server-rendered (the fixture data
 * stays off the client bundle); only the countdown is a client island.
 *
 * The page decides *whether* a pub shows sport and renders this only for those
 * that do — this component just lists the next few kickoffs in Perth time with
 * the WA trading reality, and retires itself once the tournament is over. It
 * never claims the pub is showing a specific match.
 */
export default function PubWorldCup({ pubName }: { pubName: string }) {
  const now = new Date()
  if (perthToday(now) > WC_LAST_DAY) return null

  const upcoming = WC_FIXTURES
    .filter(fixture => matchPhase(fixture, now) !== 'played')
    .slice(0, UPCOMING_COUNT)
  if (upcoming.length === 0) return null

  const nextId = upcoming.find(fixture => matchPhase(fixture, now) === 'upcoming')?.id ?? null

  return (
    <section aria-label="World Cup 2026 kickoffs in Perth time" className="border-3 border-ink rounded-card bg-white shadow-hard-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2.5">
        <p className="inline-flex items-center gap-1.5 font-mono text-[0.75rem] font-bold uppercase tracking-[0.06em] text-white">
          <Tv className="h-3.5 w-3.5" aria-hidden="true" />
          World Cup 2026 · free on SBS
        </p>
        <Link
          href="/world-cup"
          className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[0.66rem] font-bold uppercase tracking-[0.05em] text-amber-light no-underline hover:underline"
        >
          All kickoffs
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <ul className="divide-y divide-ink/10">
        {upcoming.map(fixture => {
          const status = tradingStatus(fixture.kickoff)
          const live = matchPhase(fixture, now) === 'live'
          return (
            <li
              key={fixture.id}
              className={`grid grid-cols-[4.2rem_1fr] items-center gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[4.2rem_1fr_auto] ${
                fixture.socceroos ? 'bg-amber-pale/60' : ''
              }`}
            >
              <span className="font-mono text-[0.85rem] font-bold text-ink">
                {formatKickoff(fixture.kickoff)}
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] text-gray-mid">
                  {formatDayHeading(fixtureDay(fixture.kickoff))}{fixture.round ? ` · ${fixture.round}` : ''}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[0.9rem] text-ink">
                  <TeamName team={fixture.home} />
                  <span className="font-mono text-[0.7rem] text-gray-mid">v</span>
                  <TeamName team={fixture.away} />
                </span>
              </span>
              <span className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-3 sm:row-start-1 sm:justify-end">
                {live && (
                  <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill bg-amber text-white">
                    On now
                  </span>
                )}
                {fixture.id === nextId && (
                  <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill bg-ink text-white">
                    Next
                    <WorldCupCountdown kickoff={fixture.kickoff} prefix=" · " liveText={null} className="normal-case" />
                  </span>
                )}
                {fixture.socceroos && (
                  <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill border border-ink/30 text-ink">
                    Socceroos
                  </span>
                )}
                <span
                  className={`font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill ${STATUS_CHIP_CLASSES[status]}`}
                  title={TRADING_BADGES[status].detail}
                >
                  {TRADING_BADGES[status].label}
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      <p className="border-t border-ink/10 bg-off-white px-4 py-2.5 font-body text-[0.72rem] leading-snug text-gray-mid">
        {pubName} screens live sport. Whether it opens for a given kickoff is up to the venue — the pre-6am games need a special WA trading permit, so it&apos;s worth a call before you head down.
      </p>
    </section>
  )
}
