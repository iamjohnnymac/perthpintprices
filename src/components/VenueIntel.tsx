'use client'

import Link from 'next/link'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { Card, CardContent } from '@/components/ui/card'
import E from '@/lib/emoji'
import { getDistanceKm, formatDistance } from '@/lib/location'

interface VenueIntelProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

function getBracketColor(bracket: string): string {
  const num = parseInt(bracket.replace('$', ''))
  if (num <= 7) return 'bg-green-500'
  if (num <= 8) return 'bg-emerald-500'
  if (num <= 9) return 'bg-yellow-500'
  if (num <= 10) return 'bg-orange-500'
  if (num <= 11) return 'bg-red-400'
  return 'bg-red-600'
}

export default function VenueIntel({ pubs, userLocation }: VenueIntelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const priceRange = useMemo(() => {
    if (pubs.length === 0) return { min: 0, max: 0 }
    return {
      min: Math.min(...pubs.filter(p => p.price !== null).map(p => p.price!)),
      max: Math.max(...pubs.filter(p => p.price !== null).map(p => p.price!)),
    }
  }, [pubs])

  const priceBrackets = useMemo(() => {
    const brackets: Record<string, number> = {}
    const minBracket = Math.floor(priceRange.min)
    const maxBracket = Math.floor(priceRange.max)
    for (let i = minBracket; i <= maxBracket; i++) {
      const key = `$${i}`
      brackets[key] = 0
    }
    for (const pub of pubs) {
      if (pub.price === null) continue; const key = `$${Math.floor(pub.price)}`
      brackets[key] = (brackets[key] || 0) + 1
    }
    return Object.entries(brackets).sort((a, b) => {
      const numA = parseInt(a[0].replace('$', ''))
      const numB = parseInt(b[0].replace('$', ''))
      return numA - numB
    })
  }, [pubs, priceRange])

  const maxBracketCount = useMemo(() => {
    return Math.max(...priceBrackets.map(([, count]) => count), 1)
  }, [priceBrackets])

  const suburbStats = useMemo(() => {
    const map: Record<string, { totalPrice: number; count: number }> = {}
    for (const pub of pubs) {
      if (!map[pub.suburb]) map[pub.suburb] = { totalPrice: 0, count: 0 }
        if (pub.price === null) continue
      map[pub.suburb].totalPrice += pub.price
      map[pub.suburb].count += 1
    }
    return Object.entries(map).map(([name, data]) => ({
      name,
      avgPrice: data.totalPrice / data.count,
      count: data.count,
    }))
  }, [pubs])

  const overvalued = useMemo(() => {
    const suburbAvg: Record<string, number> = {}
    for (const s of suburbStats) suburbAvg[s.name] = s.avgPrice
    return pubs
      .filter(pub => pub.price !== null)
      .map(pub => ({
        pub,
        diff: (pub.price ?? 0) - (suburbAvg[pub.suburb] || (pub.price ?? 0)),
      }))
      .filter(e => e.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 5)
  }, [pubs, suburbStats])

  const undervalued = useMemo(() => {
    const suburbAvg: Record<string, number> = {}
    for (const s of suburbStats) suburbAvg[s.name] = s.avgPrice
    return pubs
      .filter(pub => pub.price !== null)
      .map(pub => ({
        pub,
        diff: (suburbAvg[pub.suburb] || (pub.price ?? 0)) - (pub.price ?? 0),
      }))
      .filter(e => e.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 5)
  }, [pubs, suburbStats])

  const cheapestSuburbs = useMemo(() => {
    return [...suburbStats].filter(s => s.count >= 2).sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 5)
  }, [suburbStats])

  const priciestSuburbs = useMemo(() => {
    return [...suburbStats].filter(s => s.count >= 2).sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 5)
  }, [suburbStats])

  const percentileData = useMemo(() => {
    const sorted = [...pubs].filter(p => p.price !== null).sort((a, b) => a.price! - b.price!)
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)].price! : 0
    const cheaperCount = sorted.filter(p => p.price !== null && p.price < median).length
    const percentile = pubs.length > 0 ? Math.round((cheaperCount / pubs.length) * 100) : 0
    return { median, percentile }
  }, [pubs])

  const summaryText = `Market Range: $${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)} ${E.bullet} ${pubs.length} venues tracked`

  return (
    <Card
      className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/40 cursor-pointer transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{E.chart_bar}</span>
            <div>
              <h3 className="font-bold font-heading text-stone-800 text-sm">VENUE ANALYTICS</h3>
              <p className="text-xs text-stone-500">{summaryText}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-stone-200/60 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h4 className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1">
                {E.chart_bar} PRICE DISTRIBUTION
              </h4>
              <div className="p-3 rounded-xl bg-white/70 border border-stone-100">
                <div className="space-y-1.5">
                  {priceBrackets.map(([bracket, count]) => (
                    <div key={bracket} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-500 w-10 text-right">{bracket}</span>
                      <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getBracketColor(bracket)}`}
                          style={{ width: `${(count / maxBracketCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-stone-600 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100 text-center">
              <p className="text-xs text-stone-500">Median Pint Price in Perth</p>
              <p className="text-xl font-bold text-ocean">${percentileData.median.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400">{percentileData.percentile}% of venues are cheaper than the median</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                  {E.chart_down} UNDERVALUED {E.dash} Below Market
                </h4>
                <div className="space-y-1">
                  {undervalued.map(({ pub, diff }) => (
                    <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-lg bg-green-50/60 border border-green-100">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                        <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-green-700">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</p>
                        <p className="text-[9px] text-green-600">{E.down_arrow}-${diff.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                  {E.chart_up} OVERVALUED {E.dash} Above Market
                </h4>
                <div className="space-y-1">
                  {overvalued.map(({ pub, diff }) => (
                    <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                        <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-red-600">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</p>
                        <p className="text-[9px] text-red-500">{E.up_arrow}+${diff.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                  {E.green_circle} CHEAPEST SUBURBS
                </h4>
                <div className="space-y-1">
                  {cheapestSuburbs.map((suburb, i) => (
                    <div key={suburb.name} className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-400">{i + 1}</span>
                        <span className="text-xs font-semibold text-stone-800">{suburb.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-green-700">${suburb.avgPrice.toFixed(2)}</span>
                        <span className="text-[9px] text-stone-400 ml-1">({suburb.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                  {E.red_circle} PRICIEST SUBURBS
                </h4>
                <div className="space-y-1">
                  {priciestSuburbs.map((suburb, i) => (
                    <div key={suburb.name} className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-400">{i + 1}</span>
                        <span className="text-xs font-semibold text-stone-800">{suburb.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-red-600">${suburb.avgPrice.toFixed(2)}</span>
                        <span className="text-[9px] text-stone-400 ml-1">({suburb.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
