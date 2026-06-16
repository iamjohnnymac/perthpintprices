'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import TeamStripes from '@/components/TeamStripes'
import WorldCupCountdown from '@/components/WorldCupCountdown'
import { perthToday } from '@/lib/perthClock'
import { WC_FIXTURES, fixtureDay, formatDayHeading, formatKickoff } from '@/lib/worldCup'

// Last day of the tournament (the final, 19 July 2026, Perth date). The strip
// renders during the World Cup and disappears on its own afterwards.
const LAST_DAY = '2026-07-19'

export default function HomeWorldCup() {
  if (perthToday() > LAST_DAY) return null

  const socceroos = WC_FIXTURES.filter(fixture => fixture.socceroos)

  return (
    <section aria-label="World Cup 2026" className="max-w-container mx-auto px-6 mb-6">
      <div className="mb-3 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="type-eyebrow">World Cup 2026 · free on SBS</p>
        <Link
          href="/world-cup"
          className="inline-flex items-center gap-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.05em] text-amber-deep no-underline hover:underline"
        >
          Every kickoff in Perth time
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div
        className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-6 px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {socceroos.map(fixture => (
          <Link
            key={fixture.id}
            href="/world-cup"
            className="block min-w-[240px] flex-1 snap-start overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm no-underline transition-all hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover sm:min-w-0"
          >
            <TeamStripes home={fixture.home} away={fixture.away} />
            <div className="px-4 py-3">
              <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.06em] text-gray-mid">
                {formatDayHeading(fixtureDay(fixture.kickoff))}
              </p>
              <p className="mt-0.5 font-mono text-[0.95rem] font-extrabold text-ink">
                {formatKickoff(fixture.kickoff)}
                <span className="text-[0.8rem] font-bold"> · {fixture.home} v {fixture.away}</span>
              </p>
              <WorldCupCountdown
                kickoff={fixture.kickoff}
                prefix="Kicks off in "
                className="mt-1 block min-h-[1rem] font-mono text-[0.64rem] font-bold text-amber-deep"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
