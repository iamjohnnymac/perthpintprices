'use client'

import Link from 'next/link'

import { useState, useMemo, useEffect } from 'react'
import { Pub } from '@/types/pub'
import { getHappyHourStatus } from '@/lib/happyHour'
import InfoTooltip from './InfoTooltip'
import { Card, CardContent } from '@/components/ui/card'
import E from '@/lib/emoji'
import { getDistanceKm, formatDistance } from '@/lib/location'

interface TonightsMovesProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

function getPerthTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Perth' }))
}

function formatPerthTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  const m = minutes.toString().padStart(2, '0')
  return `${h}:${m} ${ampm}`
}

export default function TonightsMoves({ pubs, userLocation }: TonightsMovesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [perthTime, setPerthTime] = useState(getPerthTime)

  useEffect(() => {
    const interval = setInterval(() => {
      setPerthTime(getPerthTime())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const bestBuys = useMemo(() => {
    return [...pubs].filter(p => p.price !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      }).slice(0, 5)
  }, [pubs, userLocation])

  const activeDeals = useMemo(() => {
    return pubs
      .filter(p => {
        const status = getHappyHourStatus(p.happyHour)
        return status.isActive
      })
      .filter(p => p.price !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      })
  }, [pubs, perthTime, userLocation])

  const upcomingDeals = useMemo(() => {
    return pubs
      .filter(p => {
        const status = getHappyHourStatus(p.happyHour)
        return !status.isActive && status.isToday
      })
      .filter(p => p.price !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      })
      .slice(0, 5)
  }, [pubs, perthTime, userLocation])

  const hotSuburb = useMemo(() => {
    const suburbMap: Record<string, { activeCount: number; totalPrice: number; count: number }> = {}
    for (const pub of pubs) {
      if (!suburbMap[pub.suburb]) {
        suburbMap[pub.suburb] = { activeCount: 0, totalPrice: 0, count: 0 }
      }
        if (pub.price === null) return
      suburbMap[pub.suburb].totalPrice += pub.price!
      suburbMap[pub.suburb].count += 1
      const status = getHappyHourStatus(pub.happyHour)
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
  }, [pubs, perthTime])

  const marketTip = useMemo(() => {
    const activeHHPubs = pubs
      .filter(p => getHappyHourStatus(p.happyHour).isActive)
      .filter(p => p.price !== null).sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      })
    return activeHHPubs.length > 0 ? activeHHPubs[0] : bestBuys[0] || null
  }, [pubs, bestBuys, perthTime, userLocation])

  const summaryText = useMemo(() => {
    const bestBuy = bestBuys[0]
    const bestBuyText = bestBuy ? `Best Buy: ${bestBuy.name} ${bestBuy.price !== null ? `$${bestBuy.price.toFixed(2)}` : 'TBC'}` : ''
    const activeCount = activeDeals.length
    return `${bestBuyText} ${E.bullet} ${activeCount} happy hour${activeCount !== 1 ? 's' : ''} active`
  }, [bestBuys, activeDeals])

  return (
    <Card
      className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-stone-200/40 cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.995]"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-5 sm:p-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{E.clock}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-semibold font-heading text-stone-800 flex items-center">{`Tonight's Best Bets`}<InfoTooltip text="Updated in real-time based on current Perth time. Shows active happy hours, best prices right now, and our top pick of the moment." /></h3>
                <span className="text-[10px] text-stone-400 font-mono">{formatPerthTime(perthTime)} AWST</span>
              </div>
              <p className="text-xs text-stone-500">{summaryText}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-stone-200/60 space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Market Tip */}
            {marketTip && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
                <h4 className="text-xs font-semibold text-orange mb-1 flex items-center gap-1">
                  {E.star} MARKET TIP
                  <InfoTooltip text="Our algorithm picks the best value pub right now — weighing price, active happy hour bonus, beer quality, and suburb. Rescores as happy hours start and end." />
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/pub/${marketTip.slug}`} className="text-sm font-bold text-stone-800 hover:text-orange transition-colors">{marketTip.name}</Link>
                    <p className="text-[10px] text-stone-500">{marketTip.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, marketTip.lat, marketTip.lng))}`} {E.bullet} {marketTip.beerType}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-orange">{marketTip.price !== null ? `$${marketTip.price.toFixed(2)}` : 'TBC'}</span>
                    {getHappyHourStatus(marketTip.happyHour).isActive && (
                      <p className="text-[9px] text-orange font-semibold">HH ACTIVE</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Best Buys */}
            <div>
              <h4 className="text-xs font-semibold text-orange mb-2 flex items-center gap-1">
                {E.chart_down} BEST BUYS {E.dash} Lowest Prices Right Now
              </h4>
              <div className="space-y-1.5">
                {bestBuys.map((pub, i) => (
                  <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-stone-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-stone-400 w-4">{i + 1}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                        <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`} {E.bullet} {pub.beerType}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono text-orange flex-shrink-0">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Deals */}
            {activeDeals.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-orange mb-2 flex items-center gap-1">
                  {E.party} ACTIVE DEALS {E.dash} Happy Hour NOW ({activeDeals.length})
                </h4>
                <div className="space-y-1.5">
                  {activeDeals.slice(0, 5).map((pub) => {
                    const status = getHappyHourStatus(pub.happyHour)
                    return (
                      <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-xl bg-orange/5 border border-orange/20">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                          <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange/10 text-orange border border-orange/20">
                            {status.countdown}
                          </span>
                          <span className="text-sm font-bold font-mono text-orange">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
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
                <h4 className="text-xs font-semibold text-orange mb-2 flex items-center gap-1">
                  {E.clock} UPCOMING {E.dash} Happy Hours Starting Soon
                </h4>
                <div className="space-y-1.5">
                  {upcomingDeals.map((pub) => {
                    const status = getHappyHourStatus(pub.happyHour)
                    return (
                      <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-xl bg-orange-50/40 border border-orange-200">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                          <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange border border-orange-200">
                            {status.countdown}
                          </span>
                          <span className="text-sm font-bold text-stone-600">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Hot Suburb */}
            {hotSuburb && (
              <div className="p-3 rounded-xl bg-white/70 border border-stone-100 text-center">
                <h4 className="text-xs font-semibold text-stone-600 mb-1">{E.fire} Hot Suburb</h4>
                <p className="text-sm font-bold text-stone-800">{hotSuburb.name}</p>
                <p className="text-[10px] text-stone-400">
                  {hotSuburb.activeCount} active deal{hotSuburb.activeCount !== 1 ? 's' : ''} {E.bullet} Avg ${hotSuburb.avgPrice.toFixed(2)}
                </p>
              </div>
            )}

            {activeDeals.length === 0 && (
              <div className="text-center text-xs py-2 rounded-xl bg-white/40 text-stone-400">
                {E.crescent_moon} No happy hours active right now {E.dash} check back later!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
