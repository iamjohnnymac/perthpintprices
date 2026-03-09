'use client'

import Link from 'next/link'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'

interface VenueIntelProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

function getBracketColor(bracket: string): string {
  const num = parseInt(bracket.replace('$', ''))
  if (num <= 8) return 'bg-amber'
  if (num <= 9) return 'bg-amber'
  if (num <= 10) return 'bg-amber/70'
  return 'bg-red'
}

export default function VenueIntel({ pubs, userLocation }: VenueIntelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

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
      .slice(0, 10)
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
      .slice(0, 10)
  }, [pubs, suburbStats])

  const cheapestSuburbs = useMemo(() => {
    return [...suburbStats].filter(s => s.count >= 2).sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 10)
  }, [suburbStats])

  const priciestSuburbs = useMemo(() => {
    return [...suburbStats].filter(s => s.count >= 2).sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 10)
  }, [suburbStats])

  const percentileData = useMemo(() => {
    const sorted = [...pubs].filter(p => p.price !== null).sort((a, b) => a.price! - b.price!)
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)].price! : 0
    const cheaperCount = sorted.filter(p => p.price !== null && p.price < median).length
    const percentile = pubs.length > 0 ? Math.round((cheaperCount / pubs.length) * 100) : 0
    return { median, percentile }
  }, [pubs])

  const summaryText = `Market Range: $${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)} · ${pubs.length} venues tracked`

  return (
    <div
      className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden cursor-pointer transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">Venue Breakdown</h3>
              <p className="font-body text-[0.75rem] text-gray-mid">{summaryText}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-light space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Price Distribution */}
            <div>
              <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink mb-2 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> Price Distribution
              </h4>
              <div className="p-3 rounded-card bg-off-white">
                <div className="space-y-1.5">
                  {priceBrackets.map(([bracket, count]) => (
                    <div key={bracket} className="flex items-center gap-2">
                      <span className="font-mono text-[0.6rem] font-bold text-gray-mid w-10 text-right">{bracket}</span>
                      <div className="flex-1 h-4 bg-white rounded-pill overflow-hidden border border-gray-light">
                        <div
                          className={`h-full rounded-pill transition-all ${getBracketColor(bracket)}`}
                          style={{ width: `${(count / maxBracketCount) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[0.6rem] font-bold text-ink w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Median */}
            <div className="bg-amber-pale rounded-card p-4 text-center border-2 border-amber/30">
              <p className="font-mono text-[0.65rem] text-gray-mid uppercase tracking-[0.05em]">Median Pint Price in Perth</p>
              <p className="font-mono text-xl font-extrabold text-ink mt-1">${percentileData.median.toFixed(2)}</p>
              <p className="font-mono text-[0.6rem] text-gray-mid mt-1">{percentileData.percentile}% of venues are cheaper than the median</p>
            </div>

            {/* Under/Over valued */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink mb-2 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Undervalued
                </h4>
                <div className="space-y-0">
                  {undervalued.map(({ pub, diff }, i) => (
                    <Link key={pub.id} href={`/pub/${pub.slug}`} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                      <div className="min-w-0">
                        <span className="font-body text-[0.8rem] font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                        <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-[0.8rem] font-extrabold text-ink">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</p>
                        <p className="font-mono text-[0.6rem] font-bold text-green">-${diff.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-red mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Overvalued
                </h4>
                <div className="space-y-0">
                  {overvalued.map(({ pub, diff }, i) => (
                    <Link key={pub.id} href={`/pub/${pub.slug}`} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                      <div className="min-w-0">
                        <span className="font-body text-[0.8rem] font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                        <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-[0.8rem] font-extrabold text-red">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</p>
                        <p className="font-mono text-[0.6rem] font-bold text-red">+${diff.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Cheapest / Priciest suburbs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green" /> Cheapest Suburbs
                </h4>
                <div className="space-y-0">
                  {cheapestSuburbs.map((suburb, i) => (
                    <div key={suburb.name} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.6rem] font-bold text-gray-mid">{i + 1}</span>
                        <span className="font-body text-[0.8rem] font-bold text-ink">{suburb.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[0.8rem] font-extrabold text-ink">${suburb.avgPrice.toFixed(2)}</span>
                        <span className="font-mono text-[0.6rem] text-gray-mid ml-1">({suburb.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-red mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red" /> Priciest Suburbs
                </h4>
                <div className="space-y-0">
                  {priciestSuburbs.map((suburb, i) => (
                    <div key={suburb.name} className={`flex items-center justify-between px-3 py-2 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.6rem] font-bold text-gray-mid">{i + 1}</span>
                        <span className="font-body text-[0.8rem] font-bold text-ink">{suburb.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[0.8rem] font-extrabold text-red">${suburb.avgPrice.toFixed(2)}</span>
                        <span className="font-mono text-[0.6rem] text-gray-mid ml-1">({suburb.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
