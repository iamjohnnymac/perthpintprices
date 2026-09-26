'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { GF_FREO_PURPLE, grandFinalPhase, timeToBounce } from '@/lib/grandFinal'

export default function GrandFinalBanner() {
  const pathname = usePathname()
  // Starts null so the server render and first client render agree, then
  // ticks each minute to move from countdown to "on now" (the same
  // hydration-safe pattern the World Cup strip used).
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const phase = now ? grandFinalPhase(now) : 'pre'
  if (phase === 'over' || pathname?.startsWith('/admin')) return null

  const countdown = now ? timeToBounce(now) : null
  const status = phase === 'live' ? 'On now' : countdown ? `Bounce in ${countdown}` : 'Today'
  const onHub = pathname === '/grand-final'

  const content = (
    <div className="max-w-container mx-auto flex flex-wrap items-center gap-x-3 gap-y-0.5 px-6 py-2">
      <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.08em] text-white/75">
        AFL Grand Final · {status}
      </span>
      <span className="font-mono text-[0.78rem] font-bold text-white">
        Fremantle v Brisbane · 12:30pm Perth time
      </span>
      {!onHub && (
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-white underline-offset-2 group-hover:underline">
          Where to watch it
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
    </div>
  )

  return (
    <aside aria-label="AFL Grand Final" style={{ backgroundColor: GF_FREO_PURPLE }}>
      {onHub ? content : (
        <Link href="/grand-final" className="group block no-underline">
          {content}
        </Link>
      )}
    </aside>
  )
}
