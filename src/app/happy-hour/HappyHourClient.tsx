'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
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

  const pubs = useMemo(() => {
    const sorted = [...allPubs]
    if (sortMode === 'nearest' && userLocation) {
      sorted.sort((a, b) => {
        const distA = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng)
        const distB = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        return distA - distB
      })
    } else {
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
    if (mins < 60) return `${mins}m left`
    const hours = Math.floor(mins / 60)
    const remainder = mins % 60
    if (remainder === 0) return `${hours}h left`
    return `${hours}h ${remainder}m left`
  }

  const hasLocation = locationState === 'granted' && userLocation !== null

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Happy Hours" />

      <div className="max-w-container mx-auto px-6 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1]">
            Happy Hours
          </h1>

          {!loading && pubs.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(45,122,61,0.5)] animate-pulse" />
              <span className="font-mono text-[0.75rem] font-bold text-ink">
                {pubs.length} active now
              </span>
            </div>
          )}

          {lastRefresh && !loading && (
            <p className="text-gray-mid text-[0.7rem] mt-2">
              Auto-refreshes every 60s
            </p>
          )}
        </div>

        {/* Sort Controls */}
        {!loading && pubs.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSortMode('price')}
              className={`font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-pill px-5 py-2.5 transition-all ${
                sortMode === 'price'
                  ? 'bg-ink text-white shadow-hard-sm'
                  : 'bg-white text-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
              }`}
            >
              Cheapest
            </button>
            {hasLocation && (
              <button
                onClick={() => setSortMode(sortMode === 'nearest' ? 'price' : 'nearest')}
                className={`font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-pill px-5 py-2.5 transition-all ${
                  sortMode === 'nearest'
                    ? 'bg-ink text-white shadow-hard-sm'
                    : 'bg-white text-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
                }`}
              >
                Nearest
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 border-4 border-gray border-t-amber rounded-full animate-spin" />
            <span className="text-gray-mid font-medium">Loading happy hours...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && pubs.length === 0 && (
          <div className="border-3 border-ink rounded-card p-8 text-center shadow-hard-sm">
            <h2 className="font-mono font-extrabold text-xl text-ink mb-3">
              No happy hours right now
            </h2>
            <p className="text-gray-mid text-sm mb-6 max-w-md mx-auto leading-relaxed">
              Check back during the week. Most kick off between 4-6pm.
              We&apos;ll show live deals as soon as they start.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              Browse all pubs
            </Link>
          </div>
        )}

        {/* Pub List */}
        {!loading && pubs.length > 0 && (
          <div className="space-y-0">
            {pubs.map((pub, i) => {
              const savings = pub.happyHourPrice != null
                ? (pub.regularPrice ?? 0) - pub.happyHourPrice
                : 0
              const distance = userLocation
                ? getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)
                : null

              return (
                <Link
                  key={pub.id}
                  href={`/pub/${pub.slug}`}
                  className={`flex items-center gap-4 py-4 no-underline group ${
                    i < pubs.length - 1 ? 'border-b border-gray-light' : ''
                  }`}
                >
                  {/* Rank */}
                  <span className="font-mono text-[0.75rem] font-bold text-gray-mid w-6 text-right flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.85rem] font-extrabold text-ink group-hover:text-amber transition-colors truncate">
                        {pub.name}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider bg-red-pale text-red border border-red flex-shrink-0">
                        HH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.75rem] text-gray-mid mt-0.5">
                      <span>{pub.suburb}</span>
                      {distance != null && (
                        <span>· {formatDistance(distance)}</span>
                      )}
                      {pub.happyHourLabel && (
                        <span>· {pub.happyHourLabel}</span>
                      )}
                    </div>
                    {pub.happyHourMinutesRemaining != null && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[0.65rem] font-bold text-red">
                        <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                        {formatMinutesRemaining(pub.happyHourMinutesRemaining)}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    {pub.happyHourPrice != null ? (
                      <>
                        <span className="font-mono text-[1.3rem] font-extrabold text-ink">
                          ${pub.happyHourPrice.toFixed(2)}
                        </span>
                        {pub.regularPrice != null && (
                          <div className="text-[0.7rem] text-gray-mid line-through">
                            ${pub.regularPrice.toFixed(2)}
                          </div>
                        )}
                        {savings > 0 && (
                          <div className="text-[0.65rem] font-bold text-green">
                            Save ${savings.toFixed(2)}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="font-mono text-[1.3rem] font-extrabold text-ink">
                        ${pub.price?.toFixed(2) ?? 'TBC'}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && pubs.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              View all pubs
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
