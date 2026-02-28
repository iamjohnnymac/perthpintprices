'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PintOfTheDayData {
  date: string
  pub: {
    name: string
    slug: string
    suburb: string
    price: number
    effectivePrice: number
    beerType: string | null
    isHappyHourNow: boolean
  }
  reason: string
}

export default function PintOfTheDayCompact() {
  const [data, setData] = useState<PintOfTheDayData | null>(null)

  useEffect(() => {
    try {
      const cached = localStorage.getItem('arvo-potd')
      if (cached) {
        const parsed = JSON.parse(cached)
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' })
        if (parsed.date === today) { setData(parsed); return }
      }
    } catch {}
    fetch('/api/pint-of-the-day')
      .then(res => res.json())
      .then(result => {
        if (result.pub) {
          setData(result)
          try { localStorage.setItem('arvo-potd', JSON.stringify(result)) } catch {}
        }
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <Link
      href={`/pub/${data.pub.slug}`}
      className="block w-full max-w-2xl mx-auto mt-4 mb-2 group"
    >
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white/80 border border-stone-200/50 hover:border-amber/30 hover:shadow-md transition-all">
        <div className="flex-shrink-0 text-center">
          <span className="text-2xl font-bold font-mono text-amber">${data.pub.effectivePrice.toFixed(2)}</span>
          <p className="text-[10px] text-stone-400 font-medium mt-0.5">pint of the day</p>
        </div>
        <div className="h-8 w-px bg-stone-200/60 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal group-hover:text-amber transition-colors truncate">
            {data.pub.name}
          </p>
          <p className="text-xs text-stone-400 truncate">
            {data.pub.suburb}{data.pub.beerType ? ` · ${data.pub.beerType}` : ''}
          </p>
        </div>
        <span className="text-stone-300 group-hover:text-amber transition-colors flex-shrink-0">→</span>
      </div>
    </Link>
  )
}
