'use client'

import { useEffect, useState } from 'react'
import { formatCountdown, matchPhase } from '@/lib/worldCup'

interface WorldCupCountdownProps {
  /** Kickoff ISO string with offset */
  kickoff: string
  /** Text rendered before the ticking value, e.g. "Kicks off in " */
  prefix?: string
  /** Shown while the match is in play; pass null to render nothing */
  liveText?: string | null
  className?: string
}

/**
 * Seconds-ticking countdown to a kickoff. Renders an empty placeholder until
 * mounted (the server can't know the client's clock, so this avoids a
 * hydration mismatch), then ticks every second. After kickoff it shows
 * liveText for the ~2h match window, then renders nothing.
 */
export default function WorldCupCountdown({ kickoff, prefix = '', liveText = 'On now', className }: WorldCupCountdownProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return <span className={className} aria-hidden="true" />

  const msUntil = new Date(kickoff).getTime() - now.getTime()
  if (msUntil <= 0) {
    const phase = matchPhase({ id: '', kickoff, home: '', away: '' }, now)
    if (phase === 'live' && liveText) return <span className={className}>{liveText}</span>
    return null
  }

  return (
    <span className={className}>
      {prefix}
      {formatCountdown(msUntil)}
    </span>
  )
}
