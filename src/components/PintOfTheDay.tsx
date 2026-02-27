'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PintOfTheDayData {
  date: string
  pub: {
    name: string
    slug: string
    suburb: string
    address: string
    price: number
    effectivePrice: number
    beerType: string | null
    happyHour: string | null
    isHappyHourNow: boolean
    imageUrl: string | null
  }
  reason: string
  runnerUp: {
    name: string
    slug: string
    suburb: string
    price: number
  } | null
}

export default function PintOfTheDay() {
  const [data, setData] = useState<PintOfTheDayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem('arvo-potd')
      if (cached) {
        const parsed = JSON.parse(cached)
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' })
        if (parsed.date === today) {
          setData(parsed)
          setLoading(false)
          return
        }
      }
    } catch {}

    fetch('/api/pint-of-the-day')
      .then(res => res.json())
      .then(result => {
        if (result.pub) {
          setData(result)
          try { localStorage.setItem('arvo-potd', JSON.stringify(result)) } catch {}
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleShare() {
    if (!data) return
    const text = `🍺 Arvo Pint of the Day\n\n${data.pub.name} — ${data.pub.suburb}\n$${data.pub.effectivePrice.toFixed(2)} pint${data.pub.beerType ? ` (${data.pub.beerType})` : ''}\n${data.reason}\n\narvo.pub/pub/${data.pub.slug}`
    
    try {
      await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      // Fallback
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange/5 to-orange/10 rounded-2xl border border-orange/20 p-4 sm:p-5 animate-pulse">
        <div className="h-4 bg-orange/10 rounded w-32 mb-3" />
        <div className="h-6 bg-orange/10 rounded w-48 mb-2" />
        <div className="h-4 bg-orange/10 rounded w-24" />
      </div>
    )
  }

  if (!data) return (
    <div className="bg-white rounded-2xl border border-stone-200/40 p-6 text-center">
      <p className="text-stone-400 text-sm">Pint of the Day loading...</p>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-orange/5 via-white to-orange/10 rounded-2xl border border-orange/30 overflow-hidden">
      {/* Header strip */}
      <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍺</span>
          <div>
            <h3 className="text-xs font-bold text-orange-dark tracking-wide">Pint of the Day</h3>
            <p className="text-[10px] text-stone-400">{new Date(data.date + 'T00:00:00+08:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-stone-500 hover:text-orange-dark hover:bg-orange/10 rounded-full transition-all"
        >
          {shared ? '✅ Copied!' : '📋 Share'}
        </button>
      </div>

      {/* Main card */}
      <Link href={`/pub/${data.pub.slug}`} className="block px-4 sm:px-5 pb-4 sm:pb-5 group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-bold font-heading text-charcoal group-hover:text-orange transition-colors truncate">{data.pub.name}</h4>
            <p className="text-xs text-stone-500 mt-0.5">{data.pub.suburb} · {data.pub.address}</p>
            {data.pub.beerType && (
              <p className="text-xs text-stone-400 mt-0.5">{data.pub.beerType}</p>
            )}
            <p className="text-xs text-orange-dark/80 font-medium mt-1.5">💡 {data.reason}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-bold font-mono ${data.pub.isHappyHourNow ? 'text-emerald-600' : 'text-orange'}`}>
              ${data.pub.effectivePrice.toFixed(2)}
            </div>
            {data.pub.isHappyHourNow && data.pub.effectivePrice < data.pub.price && (
              <div className="text-[10px] text-stone-400 line-through">${data.pub.price.toFixed(2)}</div>
            )}
            {data.pub.isHappyHourNow && (
              <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold mt-0.5">
                🍻 HH NOW
              </span>
            )}
          </div>
        </div>

        {/* Runner up */}
        {data.runnerUp && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">🥈 Runner up</span>
            <span className="text-[11px] text-stone-500">
              {data.runnerUp.name} · {data.runnerUp.suburb} · <span className="font-semibold">${data.runnerUp.price.toFixed(2)}</span>
            </span>
          </div>
        )}
      </Link>
    </div>
  )
}
