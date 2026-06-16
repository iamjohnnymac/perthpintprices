'use client'

import Link from 'next/link'

import { useState, useMemo, useEffect } from 'react'
import { Pub } from '@/types/pub'
import { getHappyHourStatus, type HappyHourStatus } from '@/lib/happyHourLive'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { Clock, Star, TrendingDown, PartyPopper, Flame, Moon } from 'lucide-react'
import { pubUrl } from '@/lib/urls'

interface TonightsMovesProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

function getPubHappyHourStatus(pub: Pub, now: Date): HappyHourStatus {
  return getHappyHourStatus({
    price: pub.regularPrice,
    happyHourPrice: pub.happyHourPrice,
    happyHourDays: pub.happyHourDays,
    happyHourStart: pub.happyHourStart,
    happyHourEnd: pub.happyHourEnd,
  }, now)
}

function formatPerthTime(date: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).toUpperCase()
}

export default function TonightsMoves({ pubs, userLocation }: TonightsMovesProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [clockInstant, setClockInstant] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setClockInstant(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const bestBuys = useMemo(() => {
    return [...pubs].filter(p => p.price !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      }).slice(0, 10)
  }, [pubs, userLocation])

  const activeDeals = useMemo(() => {
    return pubs
      .filter(p => {
        const status = getPubHappyHourStatus(p, clockInstant)
        return status.isActive
      })
      .filter(p => getPubHappyHourStatus(p, clockInstant).effectivePrice !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return (getPubHappyHourStatus(a, clockInstant).effectivePrice ?? 99) - (getPubHappyHourStatus(b, clockInstant).effectivePrice ?? 99)
      })
  }, [pubs, clockInstant, userLocation])

  const upcomingDeals = useMemo(() => {
    return pubs
      .filter(p => {
        const status = getPubHappyHourStatus(p, clockInstant)
        return !status.isActive && status.isToday
      })
      .filter(p => getPubHappyHourStatus(p, clockInstant).effectivePrice !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return (getPubHappyHourStatus(a, clockInstant).effectivePrice ?? 99) - (getPubHappyHourStatus(b, clockInstant).effectivePrice ?? 99)
      })
      .slice(0, 10)
  }, [pubs, clockInstant, userLocation])

  const hotSuburb = useMemo(() => {
    const suburbMap: Record<string, { activeCount: number; totalPrice: number; count: number }> = {}
    for (const pub of pubs) {
      if (!suburbMap[pub.suburb]) {
        suburbMap[pub.suburb] = { activeCount: 0, totalPrice: 0, count: 0 }
      }
      const status = getPubHappyHourStatus(pub, clockInstant)
        if (status.effectivePrice === null) return
      suburbMap[pub.suburb].totalPrice += status.effectivePrice
      suburbMap[pub.suburb].count += 1
      if (status.isActive) {
        suburbMap[pub.suburb].activeCount += 1
      }
    }
    const suburbs = Object.entries(suburbMap)
      .filter(([, data]) => data.activeCount > 0)
      .sort((a, b) => {
        if (b[1].activeCount !== a[1].activeCount) return b[1].activeCount - a[1].activeCount
        return (a[1].totalPrice / a[1].count) - (b[1].totalPrice / b[1].count)
      })
    if (suburbs.length === 0) return null
    const [name, data] = suburbs[0]
    return { name, activeCount: data.activeCount, avgPrice: data.totalPrice / data.count }
  }, [pubs, clockInstant])

  const marketTip = useMemo(() => {
    const activeHHPubs = pubs
      .filter(p => getPubHappyHourStatus(p, clockInstant).isActive)
      .filter(p => getPubHappyHourStatus(p, clockInstant).effectivePrice !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return (getPubHappyHourStatus(a, clockInstant).effectivePrice ?? 99) - (getPubHappyHourStatus(b, clockInstant).effectivePrice ?? 99)
      })
    return activeHHPubs.length > 0 ? activeHHPubs[0] : bestBuys[0] || null
  }, [pubs, bestBuys, clockInstant, userLocation])

  const summaryText = useMemo(() => {
    const bestBuy = bestBuys[0]
    const bestBuyText = bestBuy ? `Best Buy: ${bestBuy.name} ${bestBuy.price !== null ? `$${bestBuy.price.toFixed(2)}` : 'TBC'}` : ''
    const activeCount = activeDeals.length
    return `${bestBuyText} · ${activeCount} happy hour${activeCount !== 1 ? 's' : ''} active`
  }, [bestBuys, activeDeals])

  return (
    <div
      className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden cursor-pointer transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="type-card">{`Tonight's Best Bets`}</h3>
                <span className="font-mono text-[0.6rem] text-gray-mid">{formatPerthTime(clockInstant)} AWST</span>
              </div>
              <p className="font-body text-[0.75rem] text-gray-mid">{summaryText}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-light space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Market Tip */}
            {marketTip && (
              <div className="p-3 rounded-card bg-amber-pale border-2 border-amber/30">
                <h4 className="type-eyebrow text-amber mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Market Tip
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={pubUrl(marketTip)} className="font-body text-sm font-bold text-ink hover:text-amber transition-colors no-underline">{marketTip.name}</Link>
                    <p className="font-body text-[0.7rem] text-gray-mid">{marketTip.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, marketTip.lat, marketTip.lng))}`} · {marketTip.beerType}</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const status = getPubHappyHourStatus(marketTip, clockInstant)
                      return (
                        <>
                          <span className="font-mono text-lg font-extrabold text-ink">{status.effectivePrice !== null ? `$${status.effectivePrice.toFixed(2)}` : 'TBC'}</span>
                          {status.isActive && (
                      <p className="font-mono text-[0.55rem] font-bold text-red">HH ACTIVE</p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Best Buys */}
            <div>
              <h4 className="type-eyebrow text-ink mb-2 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Best Buys
              </h4>
              <div className="space-y-0">
                {bestBuys.map((pub, i) => (
                  <Link key={pub.id} href={pubUrl(pub)} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''} ${i === 0 ? 'bg-amber/5' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-mono text-[0.65rem] font-bold w-4 ${i === 0 ? 'text-amber' : 'text-gray-mid'}`}>{i === 0 ? '\u2605' : `${i + 1}`}</span>
                      <div className="min-w-0">
                        <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                        <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`} · {pub.beerType}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[1rem] font-extrabold text-ink flex-shrink-0">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Deals */}
            {activeDeals.length > 0 && (
              <div>
                <h4 className="type-eyebrow text-ink mb-2 flex items-center gap-1">
                  <PartyPopper className="w-3.5 h-3.5" /> Happy Hour Now ({activeDeals.length})
                </h4>
                <div className="space-y-0">
                  {activeDeals.slice(0, 10).map((pub, i) => {
                    const status = getPubHappyHourStatus(pub, clockInstant)
                    return (
                      <Link key={pub.id} href={pubUrl(pub)} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                        <div className="min-w-0">
                          <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                          <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 bg-red-pale text-red-deep border-red">
                            {status.countdown}
                          </span>
                          <span className="font-mono text-[1rem] font-extrabold text-ink">{status.effectivePrice !== null ? `$${status.effectivePrice.toFixed(2)}` : 'TBC'}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Deals */}
            {upcomingDeals.length > 0 && (
              <div>
                <h4 className="type-eyebrow text-ink mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Starting Soon
                </h4>
                <div className="space-y-0">
                  {upcomingDeals.map((pub, i) => {
                    const status = getPubHappyHourStatus(pub, clockInstant)
                    return (
                      <Link key={pub.id} href={pubUrl(pub)} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                        <div className="min-w-0">
                          <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                          <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 border-amber bg-amber text-white">
                            {status.countdown}
                          </span>
                          <span className="font-mono text-[1rem] font-extrabold text-gray-mid">{status.effectivePrice !== null ? `$${status.effectivePrice.toFixed(2)}` : 'TBC'}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Hot Suburb */}
            {hotSuburb && (
              <div className="bg-off-white rounded-card p-3 text-center">
                <h4 className="type-eyebrow mb-1 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3" /> Hot Suburb
                </h4>
                <p className="font-mono text-sm font-extrabold text-ink">{hotSuburb.name}</p>
                <p className="font-mono text-[0.65rem] text-gray-mid">
                  {hotSuburb.activeCount} active deal{hotSuburb.activeCount !== 1 ? 's' : ''} · Avg ${hotSuburb.avgPrice.toFixed(2)}
                </p>
              </div>
            )}

            {activeDeals.length === 0 && (
              <div className="bg-off-white rounded-card p-3 text-center">
                <p className="font-mono text-[0.75rem] text-gray-mid flex items-center justify-center gap-2">
                  <Moon className="w-4 h-4" /> No happy hours active right now. Check back later.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
