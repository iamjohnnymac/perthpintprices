'use client'

import { useEffect, useState } from 'react'
import { PriceHistoryPoint, supabase } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'

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
      <div className="h-24 bg-off-white rounded-card animate-pulse" />
    )
  }

  // Need at least 2 data points for meaningful history
  const pricePoints = history.filter(h => h.price !== null)
  if (pricePoints.length <= 1) return null

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
  const h = 64
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

  const lineColor = trendUp ? '#dc2626' : '#E8820C'
  const fillColor = trendUp ? 'rgba(220,38,38,0.08)' : trendFlat ? 'rgba(212,160,23,0.08)' : 'rgba(22,163,74,0.08)'

  return (
    <div className="bg-off-white rounded-card border border-gray-light p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-semibold text-ink flex items-center gap-2">
          <TrendingUp className="w-4 h-4 inline" /> Price History
        </h3>
        <div className="flex items-center gap-2">
          {!trendFlat && (
            <span className={`text-xs font-medium ${trendUp ? 'text-red' : 'text-ink'}`}>
              {trendUp ? '▲' : '▼'} {changePercent}%
            </span>
          )}
          {trendFlat && (
            <span className="text-xs font-medium text-amber">- Stable</span>
          )}
        </div>
      </div>

      {/* Mini SVG chart */}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
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
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-mid">
          {formatDate(pricePoints[0].changedAt)}
        </span>
        <span className="text-[10px] text-gray-mid">
          {formatDate(pricePoints[pricePoints.length - 1].changedAt)}
        </span>
      </div>

      {/* Price history entries (last 3) */}
      <div className="mt-3 space-y-2 border-t border-gray-light pt-3">
        {pricePoints.slice(-3).reverse().map((point, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-mid">{formatDateFull(point.changedAt)}</span>
            <span className="font-mono font-medium text-ink">
              ${point.price!.toFixed(2)}
              {point.beerType && <span className="text-gray-mid font-body ml-1">({point.beerType})</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
