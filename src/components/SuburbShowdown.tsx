'use client'

import { useState, useMemo, useCallback } from 'react'
import { Pub } from '@/types/pub'

interface SuburbStats {
  name: string
  avgPrice: number
  pubCount: number
  cheapestPub: { name: string; price: number }
  mostExpensivePub: { name: string; price: number }
  happyHourPct: number
  minPrice: number
  maxPrice: number
}

function computeSuburbStats(pubs: Pub[]): SuburbStats[] {
  const grouped: Record<string, Pub[]> = {}
  for (const pub of pubs) {
    if (!pub.suburb) continue
    if (!grouped[pub.suburb]) grouped[pub.suburb] = []
    grouped[pub.suburb].push(pub)
  }

  return Object.entries(grouped)
    .filter(([, list]) => list.length >= 2)
    .map(([name, list]) => {
      const prices = list.map(p => p.price).sort((a, b) => a - b)
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length
      const cheapest = list.reduce((min, p) => (p.price < min.price ? p : min), list[0])
      const priciest = list.reduce((max, p) => (p.price > max.price ? p : max), list[0])
      const hhCount = list.filter(p => p.happyHour && p.happyHour.trim() !== '').length

      return {
        name,
        avgPrice: Math.round(avg * 100) / 100,
        pubCount: list.length,
        cheapestPub: { name: cheapest.name, price: cheapest.price },
        mostExpensivePub: { name: priciest.name, price: priciest.price },
        happyHourPct: Math.round((hhCount / list.length) * 100),
        minPrice: prices[0],
        maxPrice: prices[prices.length - 1],
      }
    })
}

function getMatchupMessage(diff: number): string {
  if (diff === 0) return "It's a dead heat! 🤝"
  if (diff < 0.2) return 'Neck and neck! 😬'
  if (diff < 0.5) return 'A solid win! 💪'
  if (diff < 1.0) return 'Comfortable victory! 🎉'
  return 'Demolition! 💥'
}

function PriceRangeBar({ min, max, globalMin, globalMax }: { min: number; max: number; globalMin: number; globalMax: number }) {
  const range = globalMax - globalMin || 1
  const leftPct = ((min - globalMin) / range) * 100
  const widthPct = Math.max(((max - min) / range) * 100, 4)

  return (
    <div className="w-full h-3 bg-stone-200 rounded-full relative overflow-hidden">
      <div
        className="absolute h-full bg-amber-400 rounded-full"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
    </div>
  )
}

function SuburbCard({
  stats,
  isWinner,
  isLoser,
  globalMin,
  globalMax,
}: {
  stats: SuburbStats
  isWinner: boolean
  isLoser: boolean
  globalMin: number
  globalMax: number
}) {
  const borderClass = isWinner
    ? 'border-green-300 bg-green-50/50'
    : isLoser
      ? 'border-red-200 bg-red-50/30'
      : 'border-stone-200 bg-stone-50'

  return (
    <div className={`rounded-xl border-2 p-4 sm:p-5 flex-1 transition-colors ${borderClass}`}>
      <div className="text-center mb-3">
        {isWinner && <span className="text-2xl">🏆</span>}
        <h3 className="text-lg font-bold text-stone-800">{stats.name}</h3>
      </div>

      <div className="text-center mb-4">
        <span className="text-3xl font-extrabold text-amber-700">${stats.avgPrice.toFixed(2)}</span>
        <p className="text-xs text-stone-500 mt-1">avg pint price</p>
      </div>

      <div className="space-y-2 text-sm text-stone-600">
        <div className="flex justify-between">
          <span>🍺 Pubs tracked</span>
          <span className="font-semibold text-stone-800">{stats.pubCount}</span>
        </div>
        <div className="flex justify-between">
          <span>💚 Cheapest</span>
          <span className="font-semibold text-green-700 text-right text-xs max-w-[55%] truncate">
            {stats.cheapestPub.name} (${stats.cheapestPub.price.toFixed(2)})
          </span>
        </div>
        <div className="flex justify-between">
          <span>💸 Priciest</span>
          <span className="font-semibold text-red-600 text-right text-xs max-w-[55%] truncate">
            {stats.mostExpensivePub.name} (${stats.mostExpensivePub.price.toFixed(2)})
          </span>
        </div>
        <div className="flex justify-between">
          <span>🕐 Happy hours</span>
          <span className="font-semibold text-stone-800">{stats.happyHourPct}%</span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>${stats.minPrice.toFixed(2)}</span>
            <span>Price range</span>
            <span>${stats.maxPrice.toFixed(2)}</span>
          </div>
          <PriceRangeBar min={stats.minPrice} max={stats.maxPrice} globalMin={globalMin} globalMax={globalMax} />
        </div>
      </div>
    </div>
  )
}

export default function SuburbShowdown({ pubs }: { pubs: Pub[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [matchupKey, setMatchupKey] = useState(0)

  const suburbStats = useMemo(() => computeSuburbStats(pubs), [pubs])

  const pickTwo = useCallback((): [SuburbStats, SuburbStats] | null => {
    if (suburbStats.length < 2) return null
    const shuffled = [...suburbStats].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }, [suburbStats])

  const matchup = useMemo(() => pickTwo(), [matchupKey, pickTwo])

  if (suburbStats.length < 2) return null

  const globalMin = Math.min(...suburbStats.map(s => s.minPrice))
  const globalMax = Math.max(...suburbStats.map(s => s.maxPrice))

  const left = matchup?.[0]
  const right = matchup?.[1]
  if (!left || !right) return null

  const diff = Math.abs(left.avgPrice - right.avgPrice)
  const isTied = diff < 0.005
  const winnerName = isTied ? null : left.avgPrice < right.avgPrice ? left.name : right.name
  const leftWins = winnerName === left.name
  const rightWins = winnerName === right.name

  const savingsPerPint = diff
  const yearSavings = (savingsPerPint * 100).toFixed(0)

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-200 overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-amber-100/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div className="text-left">
            <h2 className="text-lg font-bold text-stone-800">Suburb Showdown</h2>
            <p className="text-xs text-stone-500">Which suburb wins on price?</p>
          </div>
        </div>
        <span className="text-stone-400 text-xl transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5">
          {/* Matchup */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start">
            <SuburbCard stats={left} isWinner={leftWins} isLoser={rightWins} globalMin={globalMin} globalMax={globalMax} />

            <div className="flex sm:flex-col items-center justify-center py-2 sm:py-0 sm:mt-16">
              <div className="bg-amber-600 text-white font-extrabold text-sm px-3 py-1.5 rounded-full shadow">
                VS
              </div>
            </div>

            <SuburbCard stats={right} isWinner={rightWins} isLoser={leftWins} globalMin={globalMin} globalMax={globalMax} />
          </div>

          {/* Result */}
          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-stone-700">
              {isTied ? "Draw! 🤝" : getMatchupMessage(diff)}
            </p>
            {!isTied && winnerName && (
              <p className="text-sm text-stone-500 mt-1">
                {winnerName} wins by ${savingsPerPint.toFixed(2)} per pint
              </p>
            )}
            {!isTied && diff > 0 && (
              <p className="text-xs text-stone-400 mt-1">
                Over 100 pints a year, that&apos;s ${yearSavings} saved! 🍺
              </p>
            )}
          </div>

          {/* New Matchup Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setMatchupKey(k => k + 1)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-full shadow transition-colors text-sm"
            >
              🔄 New Matchup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
