'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { TrendingUp, TrendingDown, Minus, Beer, MapPin, Users, BarChart3, Trophy } from 'lucide-react'

interface WeeklyData {
  weekOf: string
  previousWeek: string | null
  avgPrice: number
  avgChange: number
  avgChangePct: number
  medianPrice: number
  minPrice: number
  maxPrice: number
  totalPubs: number
  totalSuburbs: number
  cheapestSuburb: string
  cheapestSuburbAvg: number | null
  mostExpensiveSuburb: string
  mostExpensiveSuburbAvg: number | null
  cheapestPubs: { slug: string; name: string; suburb: string; price: number; beer_type: string }[]
  trending: { slug: string; name: string; reportCount: number }[]
  totalReportsThisWeek: number
}

function TrendIcon({ change }: { change: number }) {
  if (change < 0) return <TrendingDown className="w-5 h-5 text-gray-mid" />
  if (change > 0) return <TrendingUp className="w-5 h-5 text-amber" />
  return <Minus className="w-5 h-5 text-gray-mid" />
}

function trendColor(change: number) {
  if (change < 0) return 'text-gray-mid'
  if (change > 0) return 'text-amber'
  return 'text-gray-mid'
}

export default function WeeklyClient() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/weekly-report')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F0]">
        <SubPageNav title="Weekly Report" subtitle="This week in Perth pints" />
        <div className="max-w-container mx-auto px-6 py-16 text-center">
          <p className="font-mono text-gray-mid animate-pulse text-sm">Loading weekly report...</p>
        </div>
      </div>
    )
  }

  if (!data || data.avgPrice === undefined) {
    return (
      <div className="min-h-screen bg-[#FDF8F0]">
        <SubPageNav title="Weekly Report" subtitle="This week in Perth pints" />
        <div className="max-w-container mx-auto px-6 py-16 text-center">
          <BarChart3 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="font-mono text-gray-mid text-sm">No report data available yet.</p>
          <p className="text-gray-mid text-xs mt-1">Check back Monday morning.</p>
        </div>
      </div>
    )
  }

  const weekLabel = new Date(data.weekOf + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Weekly Report" subtitle="This week in Perth pints" />

      <main className="max-w-container mx-auto px-6 py-8 space-y-4">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-amber" />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Weekly</span>
          </div>
          <h1 className="font-mono font-extrabold text-[clamp(1.6rem,4vw,2rem)] tracking-[-0.03em] text-ink leading-[1.1]">
            This Week in Perth Pints
          </h1>
          <p className="text-gray-mid text-sm mt-1">Week of {weekLabel}</p>
        </div>

        {/* Big Number - Average Price */}
        <div className="border-3 border-ink rounded-card shadow-hard-sm p-5 bg-white">
          <p className="font-mono text-xs text-gray-mid uppercase mb-1">Average Pint Price</p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-4xl sm:text-5xl font-bold text-ink">${data.avgPrice.toFixed(2)}</span>
            <div className={`flex items-center gap-1 font-mono text-base font-bold ${trendColor(data.avgChange)}`}>
              <TrendIcon change={data.avgChange} />
              <span>${Math.abs(data.avgChange).toFixed(2)} ({Math.abs(data.avgChangePct).toFixed(1)}%)</span>
            </div>
          </div>
          <p className="text-gray-mid text-xs mt-2">
            Across {data.totalPubs} venues in {data.totalSuburbs} suburbs
            {data.totalReportsThisWeek > 0 && ` · ${data.totalReportsThisWeek} reports this week`}
          </p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white text-center">
            <p className="font-mono text-2xl font-bold text-ink">${data.minPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-mid mt-0.5">Cheapest Pint</p>
          </div>
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white text-center">
            <p className="font-mono text-2xl font-bold text-ink">${data.maxPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-mid mt-0.5">Priciest Pint</p>
          </div>
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white text-center">
            <p className="font-mono text-2xl font-bold text-ink">${data.medianPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-mid mt-0.5">Median Price</p>
          </div>
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white text-center">
            <p className="font-mono text-2xl font-bold text-ink">{data.totalPubs}</p>
            <p className="text-xs text-gray-mid mt-0.5">Venues Tracked</p>
          </div>
        </div>

        {/* Suburb Battle */}
        {data.cheapestSuburb && data.mostExpensiveSuburb && (
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white">
            <h2 className="font-mono text-sm font-bold text-ink mb-3 uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Suburb Snapshot
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-off-white rounded-xl p-3 text-center">
                <p className="font-mono text-sm font-bold text-ink">{data.cheapestSuburb}</p>
                {data.cheapestSuburbAvg && (
                  <p className="font-mono text-lg font-bold text-ink mt-1">${data.cheapestSuburbAvg.toFixed(2)}</p>
                )}
                <p className="text-[10px] text-gray-mid mt-0.5">Cheapest avg</p>
              </div>
              <div className="bg-off-white rounded-xl p-3 text-center">
                <p className="font-mono text-sm font-bold text-ink">{data.mostExpensiveSuburb}</p>
                {data.mostExpensiveSuburbAvg && (
                  <p className="font-mono text-lg font-bold text-ink mt-1">${data.mostExpensiveSuburbAvg.toFixed(2)}</p>
                )}
                <p className="text-[10px] text-gray-mid mt-0.5">Priciest avg</p>
              </div>
            </div>
          </div>
        )}

        {/* Cheapest Pints Right Now */}
        {data.cheapestPubs && data.cheapestPubs.length > 0 && (
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white">
            <h2 className="font-mono text-sm font-bold text-ink mb-3 uppercase flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Cheapest Pints Right Now
            </h2>
            <div className="space-y-1">
              {data.cheapestPubs.map((pub, i) => (
                <Link
                  key={pub.slug}
                  href={`/pub/${pub.slug}`}
                  className="flex items-center justify-between text-sm hover:bg-amber-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-gray-mid text-xs w-5 text-right">{i + 1}.</span>
                    <span className="font-medium text-ink truncate">{pub.name}</span>
                    <span className="text-gray-mid text-xs flex-shrink-0">{pub.suburb}</span>
                  </span>
                  <span className="font-mono font-bold text-ink flex-shrink-0 ml-2">${Number(pub.price).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending / Most Reported */}
        {data.trending && data.trending.length > 0 && (
          <div className="border-3 border-ink rounded-card shadow-hard-sm p-4 bg-white">
            <h2 className="font-mono text-sm font-bold text-ink mb-3 uppercase flex items-center gap-2">
              <Users className="w-4 h-4" /> Most Reported This Week
            </h2>
            <div className="space-y-1">
              {data.trending.map((pub) => (
                <Link
                  key={pub.slug}
                  href={`/pub/${pub.slug}`}
                  className="flex items-center justify-between text-sm hover:bg-amber-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <span className="font-medium text-ink">{pub.name}</span>
                  <span className="text-gray-mid text-xs">{pub.reportCount} report{pub.reportCount !== 1 ? 's' : ''}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-2 pb-8">
          <p className="text-gray-mid text-xs mb-3">Know a price? Help keep Perth honest.</p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-amber text-white font-mono font-bold text-sm rounded-pill px-6 py-3 hover:bg-amber/90 transition-colors"
          >
            <Beer className="w-4 h-4" /> Submit a Price
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
