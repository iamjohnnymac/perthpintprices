'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { useWatchlist } from '@/hooks/useWatchlist'
import { getDistanceKm } from '@/lib/location'

interface MyLocalsProps {
  pubs: Pub[]
  userLocation: { lat: number; lng: number } | null
}

function formatMinutes(min: number | null): string {
  if (!min || min <= 0) return ''
  if (min < 60) return `${min}m left`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`
}

export default function MyLocals({ pubs, userLocation }: MyLocalsProps) {
  const { watchlist, isLoaded, removeFromWatchlist, count } = useWatchlist()

  const watchedPubs = useMemo(() => {
    if (!isLoaded || watchlist.length === 0) return []
    return watchlist
      .map(item => {
        const pub = pubs.find(p => p.slug === item.slug)
        if (!pub) return null
        const dist = userLocation
          ? getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)
          : null
        return { ...pub, distance: dist }
      })
      .filter(Boolean) as (Pub & { distance: number | null })[]
  }, [watchlist, pubs, userLocation, isLoaded])

  if (!isLoaded || watchedPubs.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-amber/5 to-amber/10 rounded-2xl border border-amber/20 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-heading font-semibold text-charcoal flex items-center gap-2">
          <span className="text-lg">⭐</span>
          My Locals
          <span className="text-xs font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            {count}/5
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {watchedPubs.map(pub => (
          <Link
            key={pub.slug}
            href={`/pub/${pub.slug}`}
            className="group flex items-center gap-3 bg-white/80 hover:bg-white rounded-xl p-3 transition-all duration-200 border border-stone-200/60 hover:border-amber/30 hover:shadow-sm"
          >
            {/* Price badge */}
            <div className={`
              min-w-[56px] text-center py-1.5 px-2 rounded-lg font-mono font-bold text-sm
              ${pub.isHappyHourNow
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : pub.price !== null
                  ? 'bg-stone-50 text-charcoal ring-1 ring-stone-200'
                  : 'bg-stone-50 text-stone-400 ring-1 ring-stone-200'
              }
            `}>
              {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
              {pub.isHappyHourNow && (
                <div className="text-[10px] font-sans font-medium text-emerald-600 mt-0.5">HH</div>
              )}
            </div>

            {/* Pub info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-charcoal text-sm truncate group-hover:text-amber transition-colors">
                  {pub.name}
                </span>
                {pub.isHappyHourNow && pub.happyHourMinutesRemaining && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    {formatMinutes(pub.happyHourMinutesRemaining)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-stone-400">{pub.suburb}</span>
                {pub.distance !== null && (
                  <span className="text-xs text-stone-400">· {pub.distance < 1 ? `${Math.round(pub.distance * 1000)}m` : `${pub.distance.toFixed(1)}km`}</span>
                )}
                {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                  <span className="text-xs text-stone-400 line-through">${pub.regularPrice.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeFromWatchlist(pub.slug)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
              title="Remove from My Locals"
            >
              ✕
            </button>
          </Link>
        ))}
      </div>

      {count < 5 && (
        <p className="text-xs text-stone-400 mt-3 text-center">
          Tap ☆ on any pub to add it to your watchlist ({5 - count} spots left)
        </p>
      )}
    </div>
  )
}
