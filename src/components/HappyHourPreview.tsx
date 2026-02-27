'use client'

import Link from 'next/link'
import { Pub } from '@/types/pub'

interface HappyHourPreviewProps {
  pubs: Pub[]
}

export default function HappyHourPreview({ pubs }: HappyHourPreviewProps) {
  const hhPubs = pubs
    .filter(p => p.happyHourStart && p.happyHourEnd)
    .map(pub => {
      const now = new Date()
      const perthTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Perth' }))
      const currentMinutes = perthTime.getHours() * 60 + perthTime.getMinutes()
      
      const [startH, startM] = (pub.happyHourStart || '16:00').split(':').map(Number)
      const startMinutes = startH * 60 + startM
      
      const isActive = pub.isHappyHourNow
      let minutesUntil = startMinutes - currentMinutes
      if (minutesUntil < 0) minutesUntil += 1440
      
      return { pub, isActive, minutesUntil }
    })
    .sort((a, b) => {
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      return a.minutesUntil - b.minutesUntil
    })
    .slice(0, 10)

  if (hhPubs.length === 0) return null

  const activePubs = hhPubs.filter(h => h.isActive)
  const upcomingPubs = hhPubs.filter(h => !h.isActive)
  const activeCount = activePubs.length
  const upcomingCount = upcomingPubs.length

  return (
    <Link href="/happy-hour" className="block w-full max-w-4xl mx-auto mt-3 group">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/70 border border-stone-200/50 hover:border-orange/30 hover:shadow-sm transition-all">
        {/* Pulse dot + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeCount > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className="text-charcoal font-semibold text-sm whitespace-nowrap">
            {activeCount > 0 ? `${activeCount} live` : 'Happy hours'}
          </span>
        </div>

        {/* Separator */}
        <span className="text-stone-300 text-sm">·</span>

        {/* Pub names — flowing inline text */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm text-stone-500 truncate">
            {activeCount > 0 && activePubs.map((h, i) => (
              <span key={h.pub.slug}>
                <span className="text-charcoal font-medium">{h.pub.name}</span>
                {i < activePubs.length - 1 && <span className="text-stone-300 mx-1.5">·</span>}
              </span>
            ))}
            {activeCount > 0 && upcomingCount > 0 && (
              <span className="text-stone-300 mx-1.5">·</span>
            )}
            {upcomingCount > 0 && (
              <span className="text-stone-400">
                {activeCount > 0
                  ? `${upcomingCount} more starting soon`
                  : `${upcomingCount} starting soon`
                }
              </span>
            )}
          </p>
        </div>

        {/* Arrow */}
        <span className="text-stone-400 group-hover:text-orange transition-colors flex-shrink-0 text-sm">→</span>
      </div>
    </Link>
  )
}
