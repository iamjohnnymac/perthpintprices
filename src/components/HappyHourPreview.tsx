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
      const [endH, endM] = (pub.happyHourEnd || '18:00').split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      
      const isActive = pub.isHappyHourNow
      let minutesUntil = startMinutes - currentMinutes
      if (minutesUntil < 0) minutesUntil += 1440
      
      return { pub, isActive, minutesUntil, startTime: `${startH}:${(startM||0).toString().padStart(2,'0')}`, endMinutes }
    })
    .sort((a, b) => {
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      return a.minutesUntil - b.minutesUntil
    })
    .slice(0, 10)

  if (hhPubs.length === 0) return null

  const activeCount = hhPubs.filter(h => h.isActive).length

  const formatCountdown = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-3">
      <div className="bg-white/80 border border-stone-200/60 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-lg">⚡</span>
          <span className="text-charcoal font-semibold text-sm">
            {activeCount > 0 ? `${activeCount} happy hours live` : "Happy hour's coming up"}
          </span>
          <span className="text-stone-400 text-xs">
            · {hhPubs.length} venues counting down
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {hhPubs.map(({ pub, isActive, minutesUntil }) => (
            <Link
              key={pub.slug}
              href={`/pub/${pub.slug}`}
              className="flex-shrink-0 snap-start bg-cream rounded-xl px-4 py-3 border border-stone-200/40 hover:border-orange/30 hover:shadow-sm transition-all min-w-[180px] group"
            >
              <p className="font-semibold text-charcoal text-sm truncate group-hover:text-orange transition-colors">{pub.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-stone-400 text-xs">{pub.suburb}</span>
                {isActive ? (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">LIVE</span>
                ) : (
                  <span className="text-xs font-mono text-stone-500">⏱ {formatCountdown(minutesUntil)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
