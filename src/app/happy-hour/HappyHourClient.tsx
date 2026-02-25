'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getPubs } from '@/lib/supabase'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'

type SortMode = 'price' | 'nearest'

export default function HappyHourClient() {
  const [allPubs, setAllPubs] = useState<Pub[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationState, setLocationState] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [sortMode, setSortMode] = useState<SortMode>('price')

  // Request geolocation on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationState('granted')
          setSortMode('nearest')
        },
        () => setLocationState('denied'),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
  }, [])

  const fetchPubs = useCallback(async () => {
    try {
      const pubs = await getPubs()
      setAllPubs(pubs.filter((p) => p.isHappyHourNow))
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching happy hour pubs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPubs()
    const interval = setInterval(fetchPubs, 60_000)
    return () => clearInterval(interval)
  }, [fetchPubs])

  // Sort pubs based on current mode
  const pubs = useMemo(() => {
    const sorted = [...allPubs]
    if (sortMode === 'nearest' && userLocation) {
      sorted.sort((a, b) => {
        const distA = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng)
        const distB = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        return distA - distB
      })
    } else {
      // Price sort: cheapest effective price first
      sorted.sort((a, b) => {
        const priceA = a.happyHourPrice ?? a.price ?? a.regularPrice ?? 999
        const priceB = b.happyHourPrice ?? b.price ?? b.regularPrice ?? 999
        return priceA - priceB
      })
    }
    return sorted
  }, [allPubs, sortMode, userLocation])

  const formatMinutesRemaining = (mins: number | null): string => {
    if (mins == null) return ''
    if (mins < 1) return 'Ending soon'
    if (mins < 60) return `${mins} min remaining`
    const hours = Math.floor(mins / 60)
    const remainder = mins % 60
    if (remainder === 0) return `${hours}h remaining`
    return `${hours}h ${remainder}m remaining`
  }

  const hasLocation = locationState === 'granted' && userLocation !== null
  const isNearestActive = sortMode === 'nearest' && hasLocation

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-orange rounded-xl flex items-center justify-center"><span className="text-white text-lg">☀</span></div>
            <span className="text-xl font-bold tracking-tight font-heading text-charcoal">
              arvo
            </span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-charcoal hover:text-orange transition-colors"
          >
            ← Back to all pubs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Title */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl sm:text-4xl">🍻</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal font-heading">
              Happy Hours Live
            </h1>
          </div>

          {!loading && pubs.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-700 font-bold text-lg">
                {pubs.length} active now
              </span>
            </div>
          )}

          <p className="text-stone-500 text-base sm:text-lg max-w-xl mx-auto">
            {loading
              ? 'Checking happy hour deals across Perth...'
              : pubs.length > 0
                ? 'These pubs have happy hour deals right now in Perth'
                : ''}
          </p>

          {lastRefresh && !loading && (
            <p className="text-stone-400 text-xs mt-2">
              Auto-refreshes every 60 seconds
            </p>
          )}
        </div>

        {/* Sort Controls */}
        {!loading && pubs.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setSortMode('price')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                sortMode === 'price'
                  ? 'bg-charcoal text-white shadow-md'
                  : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
              }`}
            >
              💰 Cheapest
            </button>
            {hasLocation && (
              <button
                onClick={() => setSortMode(sortMode === 'nearest' ? 'price' : 'nearest')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isNearestActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                }`}
              >
                📍 Nearest
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-orange/30 border-t-orange rounded-full animate-spin"></div>
            <p className="text-stone-400 text-sm">Loading happy hours...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && pubs.length === 0 && (
          <div className="text-center py-16 sm:py-20">
            <div className="text-6xl mb-6">🕐</div>
            <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-3 font-heading">
              No happy hours running right now
            </h2>
            <p className="text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
              Check back during the week — most kick off between 4–6pm!
              We&apos;ll show live deals as soon as they start.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all"
            >
              Browse all pubs
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        )}

        {/* Active Happy Hour Cards */}
        {!loading && pubs.length > 0 && (
          <div className="grid gap-4 sm:gap-5">
            {pubs.map((pub) => {
              const savings = pub.happyHourPrice != null
                ? (pub.regularPrice ?? 0) - pub.happyHourPrice
                : 0
              const savingsPercent =
                pub.regularPrice && pub.regularPrice > 0 && savings > 0
                  ? Math.round((savings / pub.regularPrice) * 100)
                  : 0
              const distance = userLocation
                ? getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)
                : null

              return (
                <Link
                  key={pub.id}
                  href={`/pub/${pub.slug}`}
                  className="block bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-stone-200/60 hover:border-orange/50 hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] transition-all group overflow-hidden"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Pub info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg sm:text-xl font-bold text-charcoal group-hover:text-orange transition-colors truncate">
                            {pub.name}
                          </h2>
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange/15 text-orange border border-orange/30">
                            HH
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
                          <span>{pub.suburb}</span>
                          {distance != null && (
                            <span className="text-blue-600 font-medium">
                              · {formatDistance(distance)}
                            </span>
                          )}
                        </div>

                        {/* Schedule & Beer */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                          {pub.happyHourLabel && (
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5 text-stone-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {pub.happyHourLabel}
                            </span>
                          )}
                          {pub.beerType && (
                            <span className="inline-flex items-center gap-1">
                              <span className="text-stone-400">🍺</span>
                              {pub.beerType}
                            </span>
                          )}
                        </div>

                        {/* Countdown */}
                        {pub.happyHourMinutesRemaining != null && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200/60">
                              <span>⏱</span>
                              {formatMinutesRemaining(
                                pub.happyHourMinutesRemaining
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Pricing */}
                      <div className="shrink-0 text-right">
                        {pub.happyHourPrice != null ? (
                          <>
                            <div className="text-3xl sm:text-4xl font-bold font-mono text-green-700">
                              ${pub.happyHourPrice.toFixed(2)}
                            </div>
                            {pub.regularPrice != null && (
                              <div className="text-sm text-stone-400 line-through mt-0.5">
                                ${pub.regularPrice.toFixed(2)}
                              </div>
                            )}
                            {savings > 0 && (
                              <div className="text-xs font-semibold text-green-600 mt-1">
                                Save ${savings.toFixed(2)}{' '}
                                <span className="text-green-500">
                                  ({savingsPercent}%)
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {pub.regularPrice != null && (
                              <div className="text-3xl sm:text-4xl font-bold font-mono text-charcoal">
                                ${pub.regularPrice.toFixed(2)}
                              </div>
                            )}
                            <div className="text-xs font-medium text-orange mt-1">
                              HH price TBC
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent bar */}
                  <div className="h-1 bg-gradient-to-r from-green-400 via-orange to-green-400 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && pubs.length > 0 && (
          <div className="text-center mt-10 sm:mt-14">
            <p className="text-stone-400 text-sm mb-4">
              Want to see all venues and compare prices?
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all"
            >
              View all pubs
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
