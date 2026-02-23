'use client'

import { useEffect, useState } from 'react'
import { PriceHistoryPoint, supabase } from '@/lib/supabase'

interface PriceHistoryProps {
  pubId: number
  currentPrice: number | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PriceHistory({ pubId, currentPrice }: PriceHistoryProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('price, happy_hour_price, beer_type, changed_at, change_type, source')
          .eq('pub_id', pubId)
          .order('changed_at', { ascending: true })
        
        if (!error && data) {
          setHistory(data.map(row => ({
            price: row.price != null ? Number(row.price) : null,
            happyHourPrice: row.happy_hour_price != null ? Number(row.happy_hour_price) : null,
            beerType: row.beer_type || null,
            changedAt: row.changed_at,
            changeType: row.change_type,
            source: row.source || null,
          })))
        }
      } catch {}
      setIsLoading(false)
    }
    load()
  }, [pubId])

  if (isLoading) {
    return (
      <div className="h-24 bg-stone-50 rounded-xl animate-pulse" />
    )
  }

  // Need at least 1 data point
  const pricePoints = history.filter(h => h.price !== null)
  if (pricePoints.length === 0) return null

  // Calculate trend
  const firstPrice = pricePoints[0].price!
  const lastPrice = pricePoints[pricePoints.length - 1].price!
  const priceChange = lastPrice - firstPrice
  const trendUp = priceChange > 0
  const trendFlat = priceChange === 0
  const changePercent = firstPrice > 0 ? Math.abs((priceChange / firstPrice) * 100).toFixed(1) : '0'

  // SVG mini chart
  const prices = pricePoints.map(p => p.price!)
  const minP = Math.min(...prices) - 0.5
  const maxP = Math.max(...prices) + 0.5
  const range = maxP - minP || 1
  const w = 200
  const h = 48
  const padding = 4

  const points = prices.map((p, i) => {
    const x = padding + (i / Math.max(prices.length - 1, 1)) * (w - padding * 2)
    const y = padding + (1 - (p - minP) / range) * (h - padding * 2)
    return `${x},${y}`
  }).join(' ')

  // Gradient fill path
  const fillPoints = prices.map((p, i) => {
    const x = padding + (i / Math.max(prices.length - 1, 1)) * (w - padding * 2)
    const y = padding + (1 - (p - minP) / range) * (h - padding * 2)
    return `${x},${y}`
  })
  const fillPath = `M${padding},${h - padding} L${fillPoints.join(' L')} L${w - padding},${h - padding} Z`

  const lineColor = trendUp ? '#dc2626' : trendFlat ? '#D4A017' : '#16a34a'
  const fillColor = trendUp ? 'rgba(220,38,38,0.08)' : trendFlat ? 'rgba(212,160,23,0.08)' : 'rgba(22,163,74,0.08)'

  return (
    <div className="bg-stone-50/80 rounded-xl border border-stone-200/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-heading font-semibold text-charcoal flex items-center gap-1.5">
          📈 Price History
        </h3>
        <div className="flex items-center gap-1.5">
          {!trendFlat && (
            <span className={`text-xs font-medium ${trendUp ? 'text-red-500' : 'text-emerald-600'}`}>
              {trendUp ? '▲' : '▼'} {changePercent}%
            </span>
          )}
          {trendFlat && (
            <span className="text-xs font-medium text-amber">— Stable</span>
          )}
        </div>
      </div>

      {/* Mini SVG chart */}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
        <path d={fillPath} fill={fillColor} />
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Current price dot */}
        {prices.length > 0 && (
          <circle
            cx={padding + ((prices.length - 1) / Math.max(prices.length - 1, 1)) * (w - padding * 2)}
            cy={padding + (1 - (prices[prices.length - 1] - minP) / range) * (h - padding * 2)}
            r="3"
            fill={lineColor}
          />
        )}
      </svg>

      {/* Timeline labels */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-stone-400">
          {formatDate(pricePoints[0].changedAt)}
        </span>
        {pricePoints.length > 1 && (
          <span className="text-[10px] text-stone-400">
            {formatDate(pricePoints[pricePoints.length - 1].changedAt)}
          </span>
        )}
      </div>

      {/* Price history entries (last 3) */}
      {pricePoints.length > 1 && (
        <div className="mt-3 space-y-1.5 border-t border-stone-200/60 pt-3">
          {pricePoints.slice(-3).reverse().map((point, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-stone-500">{formatDateFull(point.changedAt)}</span>
              <span className="font-mono font-medium text-charcoal">
                ${point.price!.toFixed(2)}
                {point.beerType && <span className="text-stone-400 font-sans ml-1">({point.beerType})</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {pricePoints.length === 1 && (
        <p className="text-xs text-stone-400 mt-2 text-center">
          Price tracking started — trend data builds over time
        </p>
      )}
    </div>
  )
}
