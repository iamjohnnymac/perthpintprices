'use client'

import { useEffect, useMemo, useState } from 'react'
import WorldCupCountdown from '@/components/WorldCupCountdown'
import {
  WC_FIXTURES,
  TRADING_BADGES,
  teamColours,
  tradingStatus,
  formatKickoff,
  fixtureDay,
  formatDayHeading,
  matchPhase,
  type MatchPhase,
  type TradingStatus,
  type WcFixture,
} from '@/lib/worldCup'

// Tiny stacked-stripe flag, glued to its team name so a wrap never separates them.
function TeamName({ team, bold }: { team: string; bold?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${bold ? 'font-bold' : ''}`}>
      <span aria-hidden="true" className="flex h-[11px] w-[17px] shrink-0 flex-col overflow-hidden rounded-[2px] border border-ink/30">
        {teamColours(team).map((colour, i) => (
          <span key={i} className="w-full flex-1" style={{ backgroundColor: colour }} />
        ))}
      </span>
      {team}
    </span>
  )
}

interface WorldCupFixturesProps {
  renderedAtIso: string
}

type Filter = 'all' | 'groupD'

const STATUS_CHIP_CLASSES: Record<TradingStatus, string> = {
  permit: 'bg-white text-amber border-2 border-amber',
  early: 'bg-white text-ink border-2 border-ink/30',
  normal: 'bg-off-white text-gray-mid border-2 border-ink/10',
}

interface DayGroup {
  day: string
  heading: string
  fixtures: Array<{ fixture: WcFixture; phase: MatchPhase; status: TradingStatus }>
}

export default function WorldCupFixtures({ renderedAtIso }: WorldCupFixturesProps) {
  const [clockInstant, setClockInstant] = useState(() => new Date(renderedAtIso))
  const [filter, setFilter] = useState<Filter>('all')
  const [showPlayed, setShowPlayed] = useState(false)

  useEffect(() => {
    setClockInstant(new Date())
    const interval = setInterval(() => setClockInstant(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const { visibleDays, playedDays, nextFixtureId } = useMemo(() => {
    const filtered = filter === 'groupD'
      ? WC_FIXTURES.filter(f => f.socceroos || f.groupD)
      : WC_FIXTURES

    const groups = new Map<string, DayGroup>()
    for (const fixture of filtered) {
      const day = fixtureDay(fixture.kickoff)
      if (!groups.has(day)) {
        groups.set(day, { day, heading: formatDayHeading(day), fixtures: [] })
      }
      groups.get(day)!.fixtures.push({
        fixture,
        phase: matchPhase(fixture, clockInstant),
        status: tradingStatus(fixture.kickoff),
      })
    }

    const allDays = Array.from(groups.values())
    const playedDays = allDays.filter(g => g.fixtures.every(f => f.phase === 'played'))
    const currentDays = allDays.filter(g => g.fixtures.some(f => f.phase !== 'played'))
    const nextFixtureId = currentDays
      .flatMap(g => g.fixtures)
      .find(f => f.phase === 'upcoming')?.fixture.id ?? null

    return { visibleDays: currentDays, playedDays, nextFixtureId }
  }, [clockInstant, filter])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {([
          ['all', 'All matches'],
          ['groupD', 'Socceroos & Group D'],
        ] as Array<[Filter, string]>).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`font-mono text-[0.7rem] font-bold uppercase tracking-[0.06em] px-4 py-2 rounded-pill border-3 border-ink transition-colors ${
              filter === value ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-off-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {playedDays.length > 0 && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowPlayed(s => !s)}
            className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.06em] text-gray-mid hover:text-ink transition-colors"
          >
            {showPlayed ? 'Hide played matches' : `Show played matches (${playedDays.reduce((n, g) => n + g.fixtures.length, 0)})`}
          </button>
        </div>
      )}

      <div className="space-y-5">
        {(showPlayed ? [...playedDays, ...visibleDays] : visibleDays).map(group => (
          <section key={group.day} aria-label={group.heading} className="border-3 border-ink rounded-card bg-white shadow-hard-sm overflow-hidden">
            <h3 className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.06em] bg-ink text-white px-4 py-2.5">
              {group.heading}
            </h3>
            <ul className="divide-y divide-ink/10">
              {group.fixtures.map(({ fixture, phase, status }) => {
                const isNext = fixture.id === nextFixtureId
                const dimmed = phase === 'played'
                return (
                  <li
                    key={fixture.id}
                    className={`grid grid-cols-[4.2rem_1fr] items-center gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[4.2rem_1fr_auto] ${
                      fixture.socceroos ? 'bg-amber-pale/60' : ''
                    } ${dimmed ? 'opacity-45' : ''}`}
                  >
                    <span className="font-mono text-[0.85rem] font-bold text-ink">
                      {formatKickoff(fixture.kickoff)}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[0.9rem] text-ink">
                      <TeamName team={fixture.home} bold={fixture.socceroos} />
                      <span className="font-mono text-[0.7rem] text-gray-mid">v</span>
                      <TeamName team={fixture.away} bold={fixture.socceroos} />
                    </span>
                    <span className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-3 sm:row-start-1 sm:justify-end">
                      {phase === 'live' && (
                        <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill bg-amber text-white">
                          On now
                        </span>
                      )}
                      {isNext && phase === 'upcoming' && (
                        <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill bg-ink text-white">
                          Next
                          <WorldCupCountdown kickoff={fixture.kickoff} prefix=" · " liveText={null} className="normal-case" />
                        </span>
                      )}
                      {(fixture.socceroos || fixture.groupD) && (
                        <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-pill border border-ink/30 text-ink">
                          {fixture.socceroos ? 'Socceroos' : 'Group D'}
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
          </section>
        ))}
      </div>

      {visibleDays.length === 0 && !showPlayed && (
        <p className="font-body text-[0.9rem] text-gray-mid">
          Group stage done. Knockout kickoff times land here once the bracket settles.
        </p>
      )}
    </div>
  )
}
