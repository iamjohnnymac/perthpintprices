'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { BarChart3 } from 'lucide-react'

interface SuburbStats {
  suburb: string
  pubCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  happyHourPct: number
  spread: { cheap: number; mid: number; pricey: number }
}

type RowItem =
  | { type: 'divider'; label: string; colorClass: string }
  | { type: 'suburb'; pos: number; stats: SuburbStats; rowBg: string }

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function SuburbLeague({ pubs }: { pubs: Pub[] }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [sortBy, setSortBy] = useState<'avg' | 'low' | 'high' | 'hh'>('avg')

  const suburbs = useMemo<SuburbStats[]>(() => {
    const grouped: Record<string, Pub[]> = {}
    for (const pub of pubs) {
      if (!pub.suburb) continue
      if (!grouped[pub.suburb]) grouped[pub.suburb] = []
      grouped[pub.suburb].push(pub)
    }

    const stats: SuburbStats[] = []
    for (const [suburb, subPubs] of Object.entries(grouped)) {
      if (subPubs.length < 2) continue
      const prices = subPubs.map(p => p.price).filter((p): p is number => p !== null && p > 0)
      if (prices.length === 0) continue

      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      const hhCount = subPubs.filter(p => p.happyHour && p.happyHour.trim() !== '').length

      // Price spread: what % of pubs are cheap/mid/pricey
      const cheap = prices.filter(p => p <= 8).length
      const mid = prices.filter(p => p > 8 && p <= 11).length
      const pricey = prices.filter(p => p > 11).length
      const total = prices.length

      stats.push({
        suburb,
        pubCount: subPubs.length,
        avgPrice: Math.round(avg * 100) / 100,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        happyHourPct: Math.round((hhCount / subPubs.length) * 100),
        spread: {
          cheap: Math.round((cheap / total) * 100),
          mid: Math.round((mid / total) * 100),
          pricey: Math.round((pricey / total) * 100),
        },
      })
    }

    stats.sort((a, b) => a.avgPrice - b.avgPrice)
    return stats
  }, [pubs])

  const sortedSuburbs = useMemo(() => {
    const sorted = [...suburbs]
    switch (sortBy) {
      case 'low': sorted.sort((a, b) => a.minPrice - b.minPrice); break
      case 'high': sorted.sort((a, b) => b.maxPrice - a.maxPrice); break
      case 'hh': sorted.sort((a, b) => b.happyHourPct - a.happyHourPct); break
      default: sorted.sort((a, b) => a.avgPrice - b.avgPrice)
    }
    return sorted
  }, [suburbs, sortBy])

  const rows = useMemo<RowItem[]>(() => {
    const total = sortedSuburbs.length
    const items: RowItem[] = []
    let rowIdx = 0

    sortedSuburbs.forEach((s, i) => {
      const pos = i + 1

      if (pos === 5 && total > 5) {
        items.push({ type: 'divider', label: '- Promotion Zone -', colorClass: 'bg-amber-pale text-amber border-amber/30' })
      }

      if (pos === total - 2 && total > 6) {
        items.push({ type: 'divider', label: '- Relegation Zone -', colorClass: 'bg-red-pale text-red border-red' })
      }

      const isRelegation = pos > total - 3 && total > 6
      let rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-off-white'
      if (pos === 1) rowBg = 'bg-amber/5'
      else if (pos === 2) rowBg = 'bg-off-white'
      else if (pos === 3) rowBg = 'bg-amber/5'
      else if (isRelegation) rowBg = 'bg-red-pale'

      items.push({ type: 'suburb', pos, stats: s, rowBg })
      rowIdx++
    })

    return items
  }, [sortedSuburbs])

  const leader = sortedSuburbs[0]
  const total = sortedSuburbs.length

  const sortLabel = sortBy === 'avg' ? 'ranked by average' : sortBy === 'low' ? 'sorted by cheapest pint' : sortBy === 'high' ? 'sorted by priciest pint' : 'sorted by happy hour %'

  return (
    <div
      className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden cursor-pointer transition-all"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 flex items-center justify-between hover:bg-off-white transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">Suburb Rankings</h3>
            <p className="font-body text-[0.75rem] text-gray-mid">
              {isExpanded
                ? `${total} suburbs ${sortLabel}. Tap columns to re-sort`
                : leader
                  ? `${leader.suburb} leads at $${leader.avgPrice.toFixed(2)} avg. Tap to explore`
                  : 'Ranked by average pint price, footy ladder style'}
            </p>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-4 sm:px-5">
          <div className="overflow-x-auto rounded-card border-2 border-gray-light max-h-[500px] overflow-y-auto relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-ink text-white font-mono text-[0.65rem] uppercase tracking-[0.05em]">
                  <th className="px-2 py-2.5 text-center font-bold w-10">Pos</th>
                  <th className="px-2 py-2.5 text-left font-bold">Suburb</th>
                  <th
                    className={`px-2 py-2.5 text-center font-bold cursor-pointer hover:text-amber transition-colors select-none ${sortBy === 'avg' ? 'text-amber' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSortBy('avg') }}
                  >
                    Avg {sortBy === 'avg' && '\u25BE'}
                  </th>
                  <th
                    className={`px-2 py-2.5 text-center font-bold cursor-pointer hover:text-amber transition-colors select-none hidden sm:table-cell ${sortBy === 'low' ? 'text-amber' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSortBy('low') }}
                  >
                    Low {sortBy === 'low' && '\u25BE'}
                  </th>
                  <th
                    className={`px-2 py-2.5 text-center font-bold cursor-pointer hover:text-amber transition-colors select-none hidden sm:table-cell ${sortBy === 'high' ? 'text-amber' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSortBy('high') }}
                  >
                    High {sortBy === 'high' && '\u25BE'}
                  </th>
                  <th
                    className={`px-2 py-2.5 text-center font-bold cursor-pointer hover:text-amber transition-colors select-none hidden md:table-cell ${sortBy === 'hh' ? 'text-amber' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSortBy('hh') }}
                  >
                    HH% {sortBy === 'hh' && '\u25BE'}
                  </th>
                  <th className="px-2 py-2.5 text-center font-bold hidden md:table-cell w-24">Spread</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  if (row.type === 'divider') {
                    return (
                      <tr key={`div-${idx}`}>
                        <td colSpan={7} className={`text-center font-mono text-[0.6rem] font-bold py-1 border-y-2 ${row.colorClass}`}>
                          {row.label}
                        </td>
                      </tr>
                    )
                  }

                  const { pos, stats: s, rowBg } = row

                  return (
                    <tr key={s.suburb} className={rowBg}>
                      <td className="px-2 py-2 text-center font-mono font-bold text-gray-mid text-[0.7rem]">{pos}</td>
                      <td className="px-2 py-2 text-left">
                        <Link href={`/suburb/${toSlug(s.suburb)}`} className="font-body text-sm font-bold text-ink hover:text-amber transition-colors no-underline">{s.suburb}</Link>
                        <span className="font-mono text-[0.6rem] text-gray-mid ml-1">({s.pubCount})</span>
                      </td>
                      <td className="px-2 py-2 text-center font-mono font-bold text-ink text-sm">${s.avgPrice.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center font-mono text-ink text-sm hidden sm:table-cell">${s.minPrice.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center font-mono text-red text-sm hidden sm:table-cell">${s.maxPrice.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center font-mono text-gray-mid text-sm hidden md:table-cell">{s.happyHourPct}%</td>
                      <td className="px-2 py-2 hidden md:table-cell">
                        <div className="flex items-center gap-0.5 justify-center" title={`${s.spread.cheap}% under $8 · ${s.spread.mid}% $8-$11 · ${s.spread.pricey}% over $11`}>
                          <div className="flex h-2.5 w-16 rounded-pill overflow-hidden bg-off-white border border-gray-light">
                            {s.spread.cheap > 0 && (
                              <div
                                className="bg-amber h-full"
                                style={{ width: `${s.spread.cheap}%` }}
                              />
                            )}
                            {s.spread.mid > 0 && (
                              <div
                                className="bg-amber/70 h-full"
                                style={{ width: `${s.spread.mid}%` }}
                              />
                            )}
                            {s.spread.pricey > 0 && (
                              <div
                                className="bg-red h-full"
                                style={{ width: `${s.spread.pricey}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber" />
              <span className="font-mono text-[0.6rem] text-gray-mid">Under $8</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber/70" />
              <span className="font-mono text-[0.6rem] text-gray-mid">$8-$11</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red" />
              <span className="font-mono text-[0.6rem] text-gray-mid">Over $11</span>
            </div>
          </div>
          <p className="font-mono text-[0.55rem] text-gray-mid text-center mt-1.5">
            Suburbs with 2+ tracked pubs. Tap column headers to sort.
          </p>
        </div>
      )}
    </div>
  )
}
