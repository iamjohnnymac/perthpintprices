'use client'

import Link from 'next/link'
import { Pub } from '@/types/pub'

interface HappyHourPreviewProps {
  pubs: Pub[]
}

export default function HappyHourPreview({ pubs }: HappyHourPreviewProps) {
  // Filter pubs that have happy hour data (any HH timing, not just active right now)
  // Sort: active first, then by minutes until start
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
      if (minutesUntil < 0) minutesUntil += 1440 // next day
      
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
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-amber/5 border border-amber/20 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-amber text-lg">🔥</span>
          <span className="text-amber font-bold text-sm">
            {activeCount > 0 ? `${activeCount} happy hours live` : "Happy hour's coming up"}
          </span>
          <span className="text-stone-400 text-sm">
            — {hhPubs.length} pubs counting down
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {hhPubs.map(({ pub, isActive, minutesUntil }) => (
            <Link
              key={pub.slug}
              href={`/pub/${pub.slug}`}
              className="flex-shrink-0 snap-start bg-white rounded-xl px-4 py-3 border border-stone-200/60 hover:border-amber/40 hover:shadow-sm transition-all min-w-[180px]"
            >
              <p className="font-bold text-charcoal text-sm truncate">{pub.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-stone-400 text-xs">{pub.suburb}</span>
                <span className={`text-xs font-mono font-bold ${isActive ? 'text-green-600' : 'text-amber'}`}>
                  {isActive ? '🟢 NOW!' : `⏱ ${formatCountdown(minutesUntil)}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
