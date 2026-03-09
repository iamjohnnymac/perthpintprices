'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

/* ─── Inline mini sparkline ─── */
function Spark({ data, width = 160, height = 36 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data) - 0.05
  const max = Math.max(...data) + 0.05
  const range = max - min || 1
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const lastY = parseFloat(points.split(' ').pop()!.split(',')[1])
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#171717" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#171717" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#spark-fill)"
      />
      <polyline points={points} fill="none" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={lastY} r="2.5" fill="#171717" stroke="white" strokeWidth="1" />
    </svg>
  )
}

export default function PintIndexBadge({ className = 'hidden sm:flex' }: { className?: string }) {
  const [snapshots, setSnapshots] = useState<{ avg_price: number; snapshot_date: string }[]>([])
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('price_snapshots')
        .select('avg_price, snapshot_date')
        .order('snapshot_date', { ascending: true })
        .limit(30)
      if (data) {
        setSnapshots(data.map((d: any) => ({
          avg_price: parseFloat(d.avg_price),
          snapshot_date: d.snapshot_date,
        })))
      }
    }
    fetchData()
  }, [])

  const index = useMemo(() => {
    if (snapshots.length < 2) return null
    const current = snapshots[snapshots.length - 1]
    const previous = snapshots[snapshots.length - 2]
    const change = current.avg_price - previous.avg_price
    const pct = (change / previous.avg_price) * 100
    const sparkData = snapshots.map(s => s.avg_price)
    return { price: current.avg_price, change, pct, sparkData }
  }, [snapshots])

  if (!index) return null

  const up = index.change >= 0

  return (
    <div
      className={`relative ${className} items-center gap-1.5 cursor-default`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="font-mono text-[0.8rem] font-extrabold text-ink tabular-nums">
        ${index.price.toFixed(2)}
      </span>
      <span className={`font-mono text-[0.6rem] font-bold ${up ? 'text-red' : 'text-green'}`}>
        {up ? '▲' : '▼'}
      </span>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border-3 border-ink rounded-card shadow-hard-sm px-4 py-3 whitespace-nowrap">
          <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-mid mb-1">
            Perth Pint Index
          </div>
          <p className="text-[0.6rem] text-gray-mid mb-2 leading-tight">
            Average pint price across Perth
          </p>
          <Spark data={index.sparkData} width={160} height={36} />
          <div className="flex items-center justify-between gap-4 mt-2">
            <span className="font-mono text-[0.65rem] font-bold text-gray-mid tabular-nums">
              {up ? '+' : ''}{index.pct.toFixed(1)}% this week
            </span>
            <span className="font-mono text-[0.6rem] font-extrabold text-ink tabular-nums">
              ${index.price.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
