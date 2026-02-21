'use client'

import { useState, useMemo, JSX } from 'react'
import { Pub } from '@/types/pub'

interface SuburbStats {
  suburb: string
  pubCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  happyHourPct: number
  form: ('green' | 'yellow' | 'red')[]
  movement: 'up' | 'down' | 'steady'
}

function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash % 100) / 100
}

function getFormColor(price: number | null): 'green' | 'yellow' | 'red' {
  if (price === null) return 'yellow'
  if (price <= 7) return 'green'
  if (price <= 9) return 'yellow'
  return 'red'
}

function getMovement(suburb: string): 'up' | 'down' | 'steady' {
  const r = seededRandom(suburb + '_move')
  if (r < 0.33) return 'up'
  if (r < 0.66) return 'down'
  return 'steady'
}

const movementIcon: Record<string, JSX.Element> = {
  up: <svg width="10" height="10" viewBox="0 0 10 10" className="text-teal inline" fill="currentColor"><path d="M5 2l4 6H1z"/></svg>,
  down: <svg width="10" height="10" viewBox="0 0 10 10" className="text-coral inline" fill="currentColor"><path d="M5 8L1 2h8z"/></svg>,
  steady: <svg width="10" height="6" viewBox="0 0 10 6" className="text-stone-400 inline" fill="currentColor"><rect x="0" y="2" width="10" height="2" rx="1"/></svg>,
}

const formDotColors: Record<string, string> = {
  green: 'bg-teal',
  yellow: 'bg-amber-400',
  red: 'bg-coral',
}

type RowItem =
  | { type: 'divider'; label: string; colorClass: string }
  | { type: 'suburb'; pos: number; stats: SuburbStats; rowBg: string }

export default function SuburbLeague({ pubs }: { pubs: Pub[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

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
      const formPubs = subPubs.slice(0, 5)
      const form = formPubs.filter(p => p.price !== null).map(p => getFormColor(p.price!))

      stats.push({
        suburb,
        pubCount: subPubs.length,
        avgPrice: Math.round(avg * 100) / 100,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        happyHourPct: Math.round((hhCount / subPubs.length) * 100),
        form,
        movement: getMovement(suburb),
      })
    }

    stats.sort((a, b) => a.avgPrice - b.avgPrice)
    return stats
  }, [pubs])

  const rows = useMemo<RowItem[]>(() => {
    const total = suburbs.length
    const items: RowItem[] = []
    let rowIdx = 0

    suburbs.forEach((s, i) => {
      const pos = i + 1

      if (pos === 5 && total > 5) {
        items.push({ type: 'divider', label: '— Promotion Zone ↑ —', colorClass: 'bg-teal/10 text-teal border-teal/30' })
      }

      if (pos === total - 2 && total > 6) {
        items.push({ type: 'divider', label: '— Relegation Zone ↓ —', colorClass: 'bg-coral/10 text-coral border-coral/30' })
      }

      const isRelegation = pos > total - 3 && total > 6
      let rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/80'
      if (pos === 1) rowBg = 'bg-amber-100/60'
      else if (pos === 2) rowBg = 'bg-stone-200/50'
      else if (pos === 3) rowBg = 'bg-orange-50/70'
      else if (isRelegation) rowBg = 'bg-coral/5'

      items.push({ type: 'suburb', pos, stats: s, rowBg })
      rowIdx++
    })

    return items
  }, [suburbs])

  const leader = suburbs[0]
  const total = suburbs.length

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/40 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-stone-100/40 transition-colors"
        >
          <div>
            <h2 className="text-sm font-bold font-heading text-stone-800 flex items-center gap-2">
              <svg className="inline w-4 h-4 mr-1.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/></svg>SUBURB LEAGUE TABLE
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {isExpanded
                ? `${total} suburbs ranked by average pint price — footy ladder style`
                : leader
                  ? `${leader.suburb} leads the table at $${leader.avgPrice.toFixed(2)} avg`
                  : 'Ranked by average pint price — footy ladder style'}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {isExpanded && (
          <div className="px-3 pb-4 sm:px-5">
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-200/60 text-stone-600 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2 text-center font-semibold w-10">Pos</th>
                    <th className="px-1 py-2 text-center font-semibold w-8">↕</th>
                    <th className="px-2 py-2 text-left font-semibold">Suburb</th>
                    <th className="px-2 py-2 text-center font-semibold">Avg</th>
                    <th className="px-2 py-2 text-center font-semibold hidden sm:table-cell">Low</th>
                    <th className="px-2 py-2 text-center font-semibold hidden sm:table-cell">High</th>
                    <th className="px-2 py-2 text-center font-semibold hidden md:table-cell">HH%</th>
                    <th className="px-2 py-2 text-center font-semibold hidden md:table-cell">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    if (row.type === 'divider') {
                      return (
                        <tr key={`div-${idx}`}>
                          <td colSpan={8} className={`text-center text-[10px] font-semibold py-1 tracking-widest uppercase border-y ${row.colorClass}`}>
                            {row.label}
                          </td>
                        </tr>
                      )
                    }

                    const { pos, stats: s, rowBg } = row

                    return (
                      <tr key={s.suburb} className={rowBg}>
                        <td className="px-2 py-2 text-center font-bold text-stone-500 text-xs">{pos}</td>
                        <td className="px-1 py-2 text-center text-xs">{movementIcon[s.movement]}</td>
                        <td className="px-2 py-2 text-left">
                          <span className="font-semibold text-stone-800">{s.suburb}</span>
                          <span className="text-[10px] text-stone-400 ml-1">({s.pubCount} pubs)</span>
                        </td>
                        <td className="px-2 py-2 text-center font-bold text-stone-800">${s.avgPrice.toFixed(2)}</td>
                        <td className="px-2 py-2 text-center text-teal hidden sm:table-cell">${s.minPrice.toFixed(2)}</td>
                        <td className="px-2 py-2 text-center text-coral hidden sm:table-cell">${s.maxPrice.toFixed(2)}</td>
                        <td className="px-2 py-2 text-center text-stone-500 hidden md:table-cell">{s.happyHourPct}%</td>
                        <td className="px-2 py-2 hidden md:table-cell">
                          <div className="flex gap-1 justify-center">
                            {s.form.map((color, j) => (
                              <span key={j} className={`inline-block w-2.5 h-2.5 rounded-full ${formDotColors[color]}`} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-stone-400 text-center mt-3">
              Updated weekly. Suburbs need 2+ tracked pubs to qualify.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
