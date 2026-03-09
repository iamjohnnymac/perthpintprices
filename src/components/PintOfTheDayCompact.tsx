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
      <div className="relative flex items-center gap-4 px-5 py-4 rounded-card bg-gradient-to-r from-amber/5 via-white to-amber/5 border border-amber/20 hover:border-amber/40 hover:shadow-lg shadow-sm transition-all">
        {/* Pint of the day badge */}
        <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-amber text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
          Pint of the day
        </div>
        <div className="flex-shrink-0 text-center">
          <span className="text-2xl font-bold font-mono text-amber">${data.pub.effectivePrice.toFixed(2)}</span>
        </div>
        <div className="h-8 w-px bg-amber/20 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink group-hover:text-amber transition-colors truncate">
            {data.pub.name}
          </p>
          <p className="text-xs text-gray-mid truncate">
            {data.pub.suburb}{data.pub.beerType ? ` · ${data.pub.beerType}` : ''}
          </p>
        </div>
        <span className="text-amber/40 group-hover:text-amber transition-colors flex-shrink-0 text-lg">→</span>
      </div>
    </Link>
  )
}
