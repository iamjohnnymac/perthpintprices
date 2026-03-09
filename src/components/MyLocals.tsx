'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { useWatchlist } from '@/hooks/useWatchlist'
import { getDistanceKm } from '@/lib/location'
import { Star, X } from 'lucide-react'

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
    <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">My Locals</h3>
              <span className="font-mono text-[0.6rem] font-bold text-gray-mid bg-off-white px-1.5 py-0.5 rounded-pill border border-gray-light">
                {count}/5
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-0">
          {watchedPubs.map((pub, i) => (
            <Link
              key={pub.slug}
              href={`/pub/${pub.slug}`}
              className={`group flex items-center gap-3 px-3 py-2.5 no-underline ${i > 0 ? 'border-t border-gray-light' : ''}`}
            >
              {/* Price badge */}
              <div className={`
                min-w-[56px] text-center py-1.5 px-2 rounded-card font-mono font-bold text-sm border-2
                ${pub.isHappyHourNow
                  ? 'bg-amber-pale text-ink border-amber/30'
                  : pub.price !== null
                    ? 'bg-off-white text-ink border-gray-light'
                    : 'bg-off-white text-gray-mid border-gray-light'
                }
              `}>
                {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                {pub.isHappyHourNow && (
                  <div className="font-mono text-[0.5rem] font-bold text-amber mt-0.5">HH</div>
                )}
              </div>

              {/* Pub info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-bold text-ink truncate group-hover:text-amber transition-colors">
                    {pub.name}
                  </span>
                  {pub.isHappyHourNow && pub.happyHourMinutesRemaining && (
                    <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 bg-amber-pale text-amber border-amber/30 shrink-0">
                      {formatMinutes(pub.happyHourMinutesRemaining)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}</span>
                  {pub.distance !== null && (
                    <span className="font-body text-[0.7rem] text-gray-mid">· {pub.distance < 1 ? `${Math.round(pub.distance * 1000)}m` : `${pub.distance.toFixed(1)}km`}</span>
                  )}
                  {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                    <span className="font-body text-[0.7rem] text-gray-mid line-through">${pub.regularPrice.toFixed(2)}</span>
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
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-mid hover:text-red hover:bg-red-pale transition-colors shrink-0"
                title="Remove from My Locals"
              >
                <X className="w-4 h-4" />
              </button>
            </Link>
          ))}
        </div>

        {count < 5 && (
          <p className="font-body text-[0.7rem] text-gray-mid mt-3 text-center">
            Tap <Star className="w-3 h-3 inline -mt-0.5" /> on any pub to add it to your watchlist ({5 - count} spots left)
          </p>
        )}
      </div>
    </div>
  )
}
