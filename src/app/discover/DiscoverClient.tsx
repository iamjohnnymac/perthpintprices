'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport, supabase } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'
import { getDistanceKm, formatDistance } from '@/lib/location'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/* ─── Types ─── */
interface PriceSnapshot {
  snapshot_date: string
  avg_price: number
  median_price: number
  min_price: number
  max_price: number
  total_pubs: number
  total_suburbs: number
  cheapest_suburb: string
  cheapest_suburb_avg: number
  most_expensive_suburb: string
  most_expensive_suburb_avg: number
  price_distribution: Record<string, number>
}

interface SuburbStats {
  suburb: string
  pubCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  happyHourPct: number
}

/* ─── Helpers ─── */
function getPerthTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Perth' }))
}

/* ─── Inline Sparkline (compact) ─── */
function MiniSparkline({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data) - 0.05
  const max = Math.max(...data) + 0.05
  const range = max - min || 1
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const trend = data[data.length - 1] - data[0]
  const color = trend > 0 ? '#DC2626' : '#E8740C'
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={parseFloat(points.split(' ').pop()!.split(',')[1])} r="3" fill={color} stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

/* ─── Full Sparkline with tooltip ─── */
function FullSparkline({ data, snapshots, width = 280, height = 60 }: { data: number[]; snapshots: PriceSnapshot[]; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; price: number; visible: boolean }>({ x: 0, y: 0, label: '', price: 0, visible: false })
  if (data.length < 2) return null
  const min = Math.min(...data) - 0.1
  const max = Math.max(...data) + 0.1
  const range = max - min || 1
  const pts = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 8) - 4
    return { x, y, val }
  })
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const trend = data[data.length - 1] - data[0]
  const color = trend > 0 ? '#DC2626' : '#E8740C'
  const gradId = 'sparkGrad-discover'
  const area = `0,${height} 0,${pts[0].y} ${polyline} ${width},${pts[pts.length - 1].y} ${width},${height}`

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (width / rect.width)
    let ci = 0, cd = Infinity
    pts.forEach((p, i) => { const d = Math.abs(p.x - mx); if (d < cd) { cd = d; ci = i } })
    const snap = snapshots[ci]
    const date = new Date(snap.snapshot_date)
    setTooltip({ x: pts[ci].x, y: pts[ci].y, label: date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }), price: data[ci], visible: true })
  }

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible cursor-crosshair" onMouseMove={handleMove} onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {tooltip.visible ? (
          <>
            <line x1={tooltip.x} y1={0} x2={tooltip.x} y2={height} stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color} stroke="white" strokeWidth="2" />
          </>
        ) : (
          <circle cx={width} cy={pts[pts.length - 1].y} r="4" fill={color} stroke="white" strokeWidth="2" />
        )}
      </svg>
      {tooltip.visible && (
        <div className="absolute z-50 bg-stone-900 text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg" style={{ left: tooltip.x, top: tooltip.y - 36, transform: tooltip.x > width * 0.75 ? 'translateX(-100%)' : tooltip.x < width * 0.25 ? 'translateX(0)' : 'translateX(-50%)' }}>
          <span className="font-semibold">${tooltip.price.toFixed(2)}</span>
          <span className="text-stone-400 ml-1">{tooltip.label}</span>
        </div>
      )}
    </div>
  )
}

/* ─── Distribution Bars (for Pint Index expanded + Venues tab) ─── */
function DistributionBars({ distribution }: { distribution: Record<string, number> }) {
  const ranges = ['$6-7', '$7-8', '$8-9', '$9-10', '$10-11', '$11-12']
  const values = ranges.map(r => distribution[r] || 0)
  const maxVal = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {ranges.map((range, i) => (
        <div key={range} className="flex flex-col items-center gap-0.5 flex-1">
          <div className="w-full rounded-sm transition-all duration-500" style={{ height: `${Math.max((values[i] / maxVal) * 32, 2)}px`, backgroundColor: i <= 1 ? '#E8820C' : i <= 3 ? '#D97706' : '#DC2626', opacity: 0.8 }} />
          <span className="text-[9px] text-stone-500 leading-none">{range.replace('$', '')}</span>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function DiscoverClient() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([])
  const [indexExpanded, setIndexExpanded] = useState(false)
  const [numbersTab, setNumbersTab] = useState<'suburbs' | 'venues' | 'value'>('suburbs')
  const [showAllSuburbs, setShowAllSuburbs] = useState(false)
  const [suburbSortBy, setSuburbSortBy] = useState<'avg' | 'low' | 'high' | 'hh'>('avg')
  const [perthTime, setPerthTime] = useState(getPerthTime)

  // ─── Data Fetching ───
  useEffect(() => {
    async function load() {
      const [pubData, crowdData] = await Promise.all([getPubs(), getCrowdLevels()])
      setPubs(pubData)
      setCrowdReports(crowdData)
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    async function fetchSnapshots() {
      const { data, error } = await supabase
        .from('price_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true })
      if (data && !error) {
        setSnapshots(data.map((d: any) => ({
          ...d,
          avg_price: parseFloat(d.avg_price),
          median_price: parseFloat(d.median_price),
          min_price: parseFloat(d.min_price),
          max_price: parseFloat(d.max_price),
          cheapest_suburb_avg: parseFloat(d.cheapest_suburb_avg),
          most_expensive_suburb_avg: parseFloat(d.most_expensive_suburb_avg),
        })))
      }
    }
    fetchSnapshots()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
  }, [])

  // Perth time clock
  useEffect(() => {
    const interval = setInterval(() => setPerthTime(getPerthTime()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Tab persistence via URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#numbers-venues') setNumbersTab('venues')
    else if (hash === '#numbers-value') setNumbersTab('value')
    else if (hash === '#numbers-suburbs') setNumbersTab('suburbs')
  }, [])

  useEffect(() => {
    if (numbersTab === 'suburbs') window.history.replaceState(null, '', '#numbers-suburbs')
    else if (numbersTab === 'venues') window.history.replaceState(null, '', '#numbers-venues')
    else if (numbersTab === 'value') window.history.replaceState(null, '', '#numbers-value')
  }, [numbersTab])

  // ─── Derived Data ───
  const verifiedPubs = useMemo(() => pubs.filter(p => p.priceVerified && p.price !== null), [pubs])

  const bestBuys = useMemo(() => {
    return [...verifiedPubs]
      .sort((a, b) => a.price! - b.price!)
      .slice(0, 10)
  }, [verifiedPubs])

  const upcomingHappyHours = useMemo(() => {
    return pubs
      .filter(p => {
        const status = getHappyHourStatus(p.happyHour)
        return (status.isActive || status.isToday) && p.price !== null
      })
      .map(p => ({ pub: p, status: getHappyHourStatus(p.happyHour) }))
      .sort((a, b) => {
        // Active first, then upcoming
        if (a.status.isActive && !b.status.isActive) return -1
        if (!a.status.isActive && b.status.isActive) return 1
        return (a.pub.price ?? 99) - (b.pub.price ?? 99)
      })
      .slice(0, 5)
  }, [pubs, perthTime])

  const heroPub = bestBuys[0] || null

  // Pub Picks counts
  const pubPickCounts = useMemo(() => ({
    sunset: pubs.filter(p => p.sunsetSpot === true).length,
    dad: pubs.filter(p => p.vibeTag === 'Local favourite' || p.vibeTag === 'Neighbourhood local').length,
    beer: verifiedPubs.length,
    cozy: pubs.filter(p => p.cozyPub === true).length,
    punt: pubs.filter(p => p.hasTab === true).length,
    happy: pubs.filter(p => p.happyHour !== null && p.happyHour !== '').length,
  }), [pubs, verifiedPubs])

  // Pint Index data
  const pintIndex = useMemo(() => {
    if (snapshots.length === 0) return null
    const current = snapshots[snapshots.length - 1]
    const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
    const oldest = snapshots[0]
    const monthChange = previous ? current.avg_price - previous.avg_price : 0
    const monthPct = previous ? (monthChange / previous.avg_price) * 100 : 0
    const yearChange = current.avg_price - oldest.avg_price
    const yearPct = (yearChange / oldest.avg_price) * 100
    const sparkData = snapshots.map(s => s.avg_price)
    return { current, previous, oldest, monthChange, monthPct, yearChange, yearPct, sparkData }
  }, [snapshots])

  // Suburb stats (for Numbers tab)
  const suburbData = useMemo<SuburbStats[]>(() => {
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
      stats.push({
        suburb,
        pubCount: subPubs.length,
        avgPrice: Math.round(avg * 100) / 100,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        happyHourPct: Math.round((hhCount / subPubs.length) * 100),
      })
    }
    return stats
  }, [pubs])

  const sortedSuburbs = useMemo(() => {
    const sorted = [...suburbData]
    switch (suburbSortBy) {
      case 'low': sorted.sort((a, b) => a.minPrice - b.minPrice); break
      case 'high': sorted.sort((a, b) => b.maxPrice - a.maxPrice); break
      case 'hh': sorted.sort((a, b) => b.happyHourPct - a.happyHourPct); break
      default: sorted.sort((a, b) => a.avgPrice - b.avgPrice)
    }
    return sorted
  }, [suburbData, suburbSortBy])

  // Venue price brackets
  const priceBrackets = useMemo(() => {
    const prices = pubs.filter(p => p.price !== null).map(p => p.price!)
    if (prices.length === 0) return []
    const minB = Math.floor(Math.min(...prices))
    const maxB = Math.floor(Math.max(...prices))
    const brackets: Record<string, number> = {}
    for (let i = minB; i <= maxB; i++) brackets[`$${i}`] = 0
    for (const price of prices) brackets[`$${Math.floor(price)}`] = (brackets[`$${Math.floor(price)}`] || 0) + 1
    return Object.entries(brackets).sort((a, b) => parseInt(a[0].replace('$', '')) - parseInt(b[0].replace('$', '')))
  }, [pubs])

  const medianPrice = useMemo(() => {
    const sorted = pubs.filter(p => p.price !== null).map(p => p.price!).sort((a, b) => a - b)
    return sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0
  }, [pubs])

  // Value Picks: undervalued / overvalued
  const suburbAvgMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of suburbData) m[s.suburb] = s.avgPrice
    return m
  }, [suburbData])

  const undervalued = useMemo(() => {
    return pubs
      .filter(p => p.price !== null && suburbAvgMap[p.suburb])
      .map(p => ({ pub: p, diff: suburbAvgMap[p.suburb] - p.price! }))
      .filter(e => e.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 5)
  }, [pubs, suburbAvgMap])

  const overvalued = useMemo(() => {
    return pubs
      .filter(p => p.price !== null && suburbAvgMap[p.suburb])
      .map(p => ({ pub: p, diff: p.price! - suburbAvgMap[p.suburb] }))
      .filter(e => e.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 5)
  }, [pubs, suburbAvgMap])

  const cheapestSuburbs = useMemo(() => [...suburbData].filter(s => s.pubCount >= 2).sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 5), [suburbData])
  const priciestSuburbs = useMemo(() => [...suburbData].filter(s => s.pubCount >= 2).sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 5), [suburbData])

  // ─── Bracket color helper ───
  function getBracketColor(bracket: string): string {
    const num = parseInt(bracket.replace('$', ''))
    if (num <= 7) return 'bg-green-500'
    if (num <= 8) return 'bg-emerald-500'
    if (num <= 9) return 'bg-yellow-500'
    if (num <= 10) return 'bg-orange-500'
    if (num <= 11) return 'bg-red-400'
    return 'bg-red-600'
  }

  // ─── Submit form trigger ───
  function openSubmitForm() {
    const btn = document.querySelector('[data-submit-trigger]') as HTMLElement | null
    if (btn) {
      btn.click()
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ─── Loading State ───
  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream">
        <SubPageNav breadcrumbs={[{ label: 'Discover' }]} />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[{ label: 'Discover' }]} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ════════════════════════════════════════════
            1. HERO: Tonight's Quick Pick
            ════════════════════════════════════════════ */}
        {heroPub && (
          <section className="pt-8 sm:pt-12 mb-10 sm:mb-14">
            <Link href={`/pub/${heroPub.slug}`} className="block">
              <div className="bg-[#FFF8F0] rounded-2xl py-12 px-6 text-center hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
                <p className="text-[#888] text-sm mb-1">Your best pint right now</p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xl">🍺</span>
                  <span className="text-[#1A1A1A] font-bold text-lg sm:text-xl">{heroPub.name}</span>
                  <span className="text-[#888] text-sm">·</span>
                  <span className="text-[#888] text-sm">{heroPub.suburb}</span>
                  {userLocation && (
                    <>
                      <span className="text-[#888] text-sm">·</span>
                      <span className="text-[#888] text-sm">{formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, heroPub.lat, heroPub.lng))}</span>
                    </>
                  )}
                </div>
                <div className="text-[40px] font-bold text-[#E8740C] tabular-nums leading-tight">
                  ${heroPub.price!.toFixed(2)}
                </div>
                <p className="text-[#888] text-sm mt-1">{heroPub.beerType}</p>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById('best-buys')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="mt-6 inline-flex items-center gap-1 text-[#E8740C] font-semibold text-sm hover:underline"
                >
                  See All Cheap Pints →
                </button>
              </div>
            </Link>
          </section>
        )}

        {/* ════════════════════════════════════════════
            2. LIVE DEALS GRID
            ════════════════════════════════════════════ */}
        <section id="best-buys" className="mb-10 sm:mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left: Best Buys */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">🏷️ Best Buys</h3>
              <p className="text-sm text-[#888] mb-4">Lowest prices right now</p>
              <div className="space-y-1">
                {bestBuys.slice(0, 5).map((pub, i) => (
                  <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAFAFA] hover:border-l-2 hover:border-l-[#E8740C] transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-[#888] w-5">{i + 1}</span>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-[#1A1A1A] truncate block group-hover:text-[#E8740C] transition-colors">{pub.name}</span>
                        <p className="text-xs text-[#888]">
                          {pub.suburb}
                          {userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}
                          {' · '}{pub.beerType}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-[#E8740C] tabular-nums flex-shrink-0">${pub.price!.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
              <Link href="/insights/tonights-best-bets" className="block mt-4 text-sm font-semibold text-[#E8740C] hover:underline">
                View all →
              </Link>
            </div>

            {/* Right: Happy Hours */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">⏰ Happy Hours</h3>
              <p className="text-sm text-[#888] mb-4">Starting soon near you</p>
              <div className="space-y-1">
                {upcomingHappyHours.length === 0 && (
                  <p className="text-sm text-[#888] py-4 text-center">No happy hours active or upcoming right now — check back later!</p>
                )}
                {upcomingHappyHours.map(({ pub, status }) => (
                  <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAFAFA] hover:border-l-2 hover:border-l-[#E8740C] transition-all group">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[#1A1A1A] truncate block group-hover:text-[#E8740C] transition-colors">{pub.name}</span>
                      <p className="text-xs text-[#888]">{pub.suburb}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-[#E8740C] border border-orange-200'}`}>
                        {status.countdown || status.statusText}
                      </span>
                      <span className="text-lg font-semibold text-[#1A1A1A] tabular-nums">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/happy-hour" className="block mt-4 text-sm font-semibold text-[#E8740C] hover:underline">
                See all happy hours →
              </Link>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════
            3. PUB PICKS CAROUSEL
            ════════════════════════════════════════════ */}
        <section className="mb-10 sm:mb-14">
          <h2 className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A]">Pub Picks</h2>
          <p className="text-[16px] text-[#888] mt-1 mb-6">Curated lists for every mood</p>

          <div
            className="flex gap-4 overflow-x-auto pl-1 pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>

            {[
              { emoji: '🌅', title: 'Sunset Sippers', desc: 'West-facing patios and rooftop bars for golden hour pints.', bg: 'bg-[#FFF3E0]', count: pubPickCounts.sunset, href: '/guides/sunset-sippers' },
              { emoji: '👨', title: 'The Dad Bar', desc: 'No fairy lights, no craft beer menu. Just honest pints and the footy on.', bg: 'bg-[#F5F5F0]', count: pubPickCounts.dad, href: '/guides/dad-bar' },
              { emoji: '🌤', title: 'Beer Weather', desc: 'Live BOM data matched to beer garden picks. Is it a beer garden arvo?', bg: 'bg-[#E8F5E9]', count: pubPickCounts.beer, href: '/guides/beer-weather' },
              { emoji: '☔', title: 'Cozy Corners', desc: 'Fireplaces, booths, and warmth for when it\'s bucketing down.', bg: 'bg-[#EDE7F6]', count: pubPickCounts.cozy, href: '/guides/cozy-corners' },
              { emoji: '🏇', title: 'Punt & Pints', desc: 'TAB screens, cold pints, and a flutter on the trots.', bg: 'bg-[#E3F2FD]', count: pubPickCounts.punt, href: '/guides/punt-and-pints' },
              { emoji: '⏰', title: 'Happy Hours', desc: 'Live deals happening right now across Perth.', bg: 'bg-[#FFF8E1]', count: pubPickCounts.happy, href: '/happy-hour' },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`${card.bg} w-[240px] sm:w-[280px] min-h-[200px] rounded-2xl p-6 flex-shrink-0 snap-start hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow group`}
              >
                <span className="text-3xl">{card.emoji}</span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mt-3 group-hover:text-[#E8740C] transition-colors">{card.title}</h3>
                <p className="text-sm text-[#666] mt-1 leading-relaxed">{card.desc}</p>
                <p className="text-sm font-semibold text-[#E8740C] mt-4">{card.count} pubs →</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════
            4. PERTH PINT INDEX (compact, collapsible)
            ════════════════════════════════════════════ */}
        {pintIndex && (
          <section className="mb-10 sm:mb-14">
            <div
              className="bg-white border border-[#E5E5E5] rounded-xl hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow cursor-pointer"
              onClick={() => setIndexExpanded(!indexExpanded)}
            >
              {/* Collapsed row */}
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A]">Perth Pint Index™</h3>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tabular-nums">${pintIndex.current.avg_price.toFixed(2)}</span>
                        <span className={`text-sm font-semibold ${pintIndex.monthChange > 0 ? 'text-red-600' : 'text-[#E8740C]'}`}>
                          {pintIndex.monthChange > 0 ? '▲' : pintIndex.monthChange < 0 ? '▼' : '—'}{' '}
                          {pintIndex.monthChange >= 0 ? '+' : ''}{pintIndex.monthChange.toFixed(2)} ({pintIndex.monthPct >= 0 ? '+' : ''}{pintIndex.monthPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block" onClick={e => e.stopPropagation()}>
                      <MiniSparkline data={pintIndex.sparkData} />
                    </div>
                  </div>
                  <button className="text-sm text-[#888] hover:text-[#1A1A1A] transition-colors flex items-center gap-1" aria-expanded={indexExpanded}>
                    {indexExpanded ? 'Collapse ▲' : 'Expand ▼'}
                  </button>
                </div>
                <p className="text-xs text-[#888] mt-2">
                  {pintIndex.current.total_pubs} pubs · {pintIndex.current.total_suburbs} suburbs · Median ${pintIndex.current.median_price.toFixed(2)}
                </p>
              </div>

              {/* Expanded content */}
              {indexExpanded && (
                <div className="px-6 pb-6 border-t border-[#E5E5E5]" onClick={e => e.stopPropagation()}>
                  <div className="pt-4">
                    {/* Full sparkline */}
                    <div className="mb-4">
                      <p className="text-xs text-[#888] mb-2">Price trend · hover to explore</p>
                      <FullSparkline data={pintIndex.sparkData} snapshots={snapshots} width={320} height={60} />
                    </div>

                    {/* Suburb comparison */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="text-[10px] text-[#E8740C] font-semibold">▼ Cheapest Suburb</div>
                        <div className="text-sm font-bold text-[#1A1A1A] mt-1">{pintIndex.current.cheapest_suburb}</div>
                        <div className="text-xs text-[#E8740C] tabular-nums">avg ${pintIndex.current.cheapest_suburb_avg.toFixed(2)}/pint</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3">
                        <div className="text-[10px] text-red-600 font-semibold">▲ Priciest Suburb</div>
                        <div className="text-sm font-bold text-[#1A1A1A] mt-1">{pintIndex.current.most_expensive_suburb}</div>
                        <div className="text-xs text-red-600 tabular-nums">avg ${pintIndex.current.most_expensive_suburb_avg.toFixed(2)}/pint</div>
                      </div>
                    </div>

                    {/* Overall change + Median */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div>
                        <div className="text-[10px] text-[#888] font-medium">Overall Change</div>
                        <div className={`text-lg font-bold tabular-nums ${pintIndex.yearChange > 0 ? 'text-red-600' : 'text-[#E8740C]'}`}>
                          {pintIndex.yearChange >= 0 ? '+' : ''}{pintIndex.yearPct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#888] font-medium">Median</div>
                        <div className="text-lg font-bold text-[#1A1A1A] tabular-nums">${pintIndex.current.median_price.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Price distribution */}
                    {pintIndex.current.price_distribution && (
                      <div>
                        <div className="text-[10px] text-[#888] font-medium mb-2">Price Distribution</div>
                        <DistributionBars distribution={pintIndex.current.price_distribution} />
                      </div>
                    )}

                    {/* Mobile sparkline */}
                    <div className="sm:hidden mt-4">
                      <p className="text-xs text-[#888] mb-2">Price trend · tap to explore</p>
                      <FullSparkline data={pintIndex.sparkData} snapshots={snapshots} width={280} height={50} />
                    </div>

                    <p className="text-[10px] text-[#888] mt-3 text-center">Tracking Perth beer prices weekly.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            5. THE NUMBERS (tabbed)
            ════════════════════════════════════════════ */}
        <section className="mb-10 sm:mb-14">
          <h2 className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A]">The Numbers</h2>
          <p className="text-[16px] text-[#888] mt-1 mb-6">How Perth&apos;s pint market stacks up</p>

          {/* Tab bar */}
          <div role="tablist" className="flex gap-0 border-b border-[#E5E5E5] mb-6">
            {[
              { id: 'suburbs' as const, label: 'Suburbs' },
              { id: 'venues' as const, label: 'Venues' },
              { id: 'value' as const, label: 'Value Picks' },
            ].map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={numbersTab === tab.id}
                onClick={() => setNumbersTab(tab.id)}
                className={`px-4 sm:px-6 py-3 text-sm sm:text-base transition-colors ${
                  numbersTab === tab.id
                    ? 'font-bold text-[#1A1A1A] border-b-2 border-[#E8740C]'
                    : 'font-normal text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div role="tabpanel">

            {/* ─── Tab 1: Suburbs ─── */}
            {numbersTab === 'suburbs' && (
              <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-100 text-[#666] text-xs">
                        <th className="px-3 py-2.5 text-center font-semibold w-10">Pos</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Suburb</th>
                        <th className={`px-3 py-2.5 text-center font-semibold cursor-pointer hover:text-[#E8740C] select-none ${suburbSortBy === 'avg' ? 'text-[#E8740C]' : ''}`} onClick={() => setSuburbSortBy('avg')}>
                          Avg {suburbSortBy === 'avg' && '▾'}
                        </th>
                        <th className={`px-3 py-2.5 text-center font-semibold cursor-pointer hover:text-[#E8740C] select-none hidden sm:table-cell ${suburbSortBy === 'low' ? 'text-[#E8740C]' : ''}`} onClick={() => setSuburbSortBy('low')}>
                          Low {suburbSortBy === 'low' && '▾'}
                        </th>
                        <th className={`px-3 py-2.5 text-center font-semibold cursor-pointer hover:text-[#E8740C] select-none hidden sm:table-cell ${suburbSortBy === 'high' ? 'text-[#E8740C]' : ''}`} onClick={() => setSuburbSortBy('high')}>
                          High {suburbSortBy === 'high' && '▾'}
                        </th>
                        <th className={`px-3 py-2.5 text-center font-semibold cursor-pointer hover:text-[#E8740C] select-none hidden md:table-cell ${suburbSortBy === 'hh' ? 'text-[#E8740C]' : ''}`} onClick={() => setSuburbSortBy('hh')}>
                          HH% {suburbSortBy === 'hh' && '▾'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllSuburbs ? sortedSuburbs : sortedSuburbs.slice(0, 5)).map((s, i) => (
                        <tr key={s.suburb} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/60'}>
                          <td className="px-3 py-2.5 text-center font-bold text-[#888] text-xs">{i + 1}</td>
                          <td className="px-3 py-2.5 text-left">
                            <span className="font-semibold text-[#1A1A1A]">{s.suburb}</span>
                            <span className="text-[10px] text-[#888] ml-1">({s.pubCount})</span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-[#1A1A1A] tabular-nums">${s.avgPrice.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center text-emerald-600 font-medium tabular-nums hidden sm:table-cell">${s.minPrice.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center text-red-500 font-medium tabular-nums hidden sm:table-cell">${s.maxPrice.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center text-[#888] hidden md:table-cell">{s.happyHourPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sortedSuburbs.length > 5 && (
                  <button
                    onClick={() => setShowAllSuburbs(!showAllSuburbs)}
                    className="w-full py-3 text-sm font-semibold text-[#E8740C] hover:bg-[#FAFAFA] transition-colors border-t border-[#E5E5E5]"
                  >
                    {showAllSuburbs ? `Show less ▲` : `Show all ${sortedSuburbs.length} suburbs ▼`}
                  </button>
                )}
              </div>
            )}

            {/* ─── Tab 2: Venues ─── */}
            {numbersTab === 'venues' && (
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">📊 Price Distribution</h4>
                <div className="space-y-2 mb-6">
                  {priceBrackets.map(([bracket, count]) => {
                    const maxCount = Math.max(...priceBrackets.map(([, c]) => c), 1)
                    return (
                      <div key={bracket} className="flex items-center gap-2">
                        <span className="text-xs text-[#888] w-10 text-right tabular-nums">{bracket}</span>
                        <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${getBracketColor(bracket)}`} style={{ width: `${(count / maxCount) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#666] w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
                  <p className="text-xs text-[#888]">Median Pint Price in Perth</p>
                  <p className="text-2xl font-bold text-[#E8740C] tabular-nums">${medianPrice.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* ─── Tab 3: Value Picks ─── */}
            {numbersTab === 'value' && (
              <div className="space-y-6">
                {/* Under/Over valued */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-green-700 mb-3">📉 Below Market</h4>
                    <div className="space-y-1.5">
                      {undervalued.map(({ pub, diff }) => (
                        <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-lg bg-green-50/60 border border-green-100 hover:bg-green-50 transition-colors">
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[#1A1A1A] truncate block">{pub.name}</span>
                            <p className="text-[10px] text-[#888]">{pub.suburb}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-green-700 tabular-nums">${pub.price!.toFixed(2)}</p>
                            <p className="text-[9px] text-green-600">↓ -${diff.toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-red-600 mb-3">📈 Above Market</h4>
                    <div className="space-y-1.5">
                      {overvalued.map(({ pub, diff }) => (
                        <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100 hover:bg-red-50 transition-colors">
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[#1A1A1A] truncate block">{pub.name}</span>
                            <p className="text-[10px] text-[#888]">{pub.suburb}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-red-600 tabular-nums">${pub.price!.toFixed(2)}</p>
                            <p className="text-[9px] text-red-500">↑ +${diff.toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cheapest / Priciest Suburbs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-green-700 mb-3">🟢 Cheapest Suburbs</h4>
                    <div className="space-y-1.5">
                      {cheapestSuburbs.map((s, i) => (
                        <div key={s.suburb} className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#888]">{i + 1}</span>
                            <span className="text-xs font-semibold text-[#1A1A1A]">{s.suburb}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-green-700 tabular-nums">${s.avgPrice.toFixed(2)}</span>
                            <span className="text-[9px] text-[#888] ml-1">({s.pubCount})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-red-600 mb-3">🔴 Priciest Suburbs</h4>
                    <div className="space-y-1.5">
                      {priciestSuburbs.map((s, i) => (
                        <div key={s.suburb} className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#888]">{i + 1}</span>
                            <span className="text-xs font-semibold text-[#1A1A1A]">{s.suburb}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-red-600 tabular-nums">${s.avgPrice.toFixed(2)}</span>
                            <span className="text-[9px] text-[#888] ml-1">({s.pubCount})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ════════════════════════════════════════════
            6. CONTRIBUTE CTA BANNER
            ════════════════════════════════════════════ */}
        <section id="contribute" className="mb-10 sm:mb-14">
          <div className="bg-[#FFF8F0] rounded-2xl py-12 px-6 text-center">
            <h2 className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A]">Know a price we&apos;re missing?</h2>
            <p className="text-[16px] text-[#888] mt-2">Help Perth drink cheaper.</p>
            <button
              onClick={openSubmitForm}
              className="mt-6 bg-[#E8740C] text-white font-semibold rounded-lg px-8 py-3 hover:bg-[#d06a0b] transition-colors"
            >
              Submit a Price
            </button>
            <p className="text-sm text-[#888] mt-4">{pubs.length} venues tracked · Updated weekly</p>
          </div>
        </section>

      </div>

      <Footer />
    </main>
  )
}
