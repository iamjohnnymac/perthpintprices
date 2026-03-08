'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport, supabase } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'
import { getDistanceKm, formatDistance } from '@/lib/location'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { Beer, Clock, Tag } from 'lucide-react'
import LucideIcon from '@/components/LucideIcon'

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

/* ─── Helpers ─── */
function getPerthTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Perth' }))
}

/* ─── Inline Sparkline (compact) ─── */
function MiniSparkline({ data, width = 120, height = 32, color: colorOverride }: { data: number[]; width?: number; height?: number; color?: string }) {
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
  const color = colorOverride || (trend > 0 ? '#171717' : '#D4740A')
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
  const color = trend > 0 ? '#171717' : '#D4740A'
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
        <div className="absolute z-50 bg-ink text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg" style={{ left: tooltip.x, top: tooltip.y - 36, transform: tooltip.x > width * 0.75 ? 'translateX(-100%)' : tooltip.x < width * 0.25 ? 'translateX(0)' : 'translateX(-50%)' }}>
          <span className="font-bold">${tooltip.price.toFixed(2)}</span>
          <span className="text-white/60 ml-1">{tooltip.label}</span>
        </div>
      )}
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

  // ─── Loading State ───
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FDF8F0]">
        <h1 className="sr-only">Discover Perth&apos;s Best Pints</h1>
        <SubPageNav breadcrumbs={[{ label: 'Discover' }]} />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-gray border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <h1 className="sr-only">Discover Perth&apos;s Best Pints</h1>
      <SubPageNav breadcrumbs={[{ label: 'Discover' }]} />

      {/* ════════════════════════════════════════════
          PINT INDEX TICKER
          ════════════════════════════════════════════ */}
      {pintIndex && (
        <div className="max-w-container mx-auto px-6 pt-4">
          <div
            className="bg-ink border-3 border-ink rounded-card shadow-hard-sm cursor-pointer overflow-hidden"
            onClick={() => setIndexExpanded(!indexExpanded)}
          >
            {/* Ticker bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <span className="font-mono text-[0.55rem] sm:text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/40 flex-shrink-0">Pint Index™</span>
                <span className="font-mono text-lg sm:text-xl font-extrabold text-amber-light tabular-nums">${pintIndex.current.avg_price.toFixed(2)}</span>
                <span className="font-mono text-[0.7rem] font-bold text-white/60">
                  {pintIndex.monthChange > 0 ? '▲' : pintIndex.monthChange < 0 ? '▼' : '-'}{' '}
                  {pintIndex.monthPct >= 0 ? '+' : ''}{pintIndex.monthPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block" onClick={e => e.stopPropagation()}>
                  <MiniSparkline data={pintIndex.sparkData} width={100} height={28} color="#F2A91A" />
                </div>
                <span className="font-mono text-[0.6rem] font-bold text-white/30">
                  {indexExpanded ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded panel */}
            {indexExpanded && (
              <div className="bg-white px-5 pb-4 pt-4 border-t-3 border-ink" onClick={e => e.stopPropagation()}>
                {/* Sparkline — responsive */}
                <div className="hidden sm:block mb-4">
                  <FullSparkline data={pintIndex.sparkData} snapshots={snapshots} width={650} height={70} />
                </div>
                <div className="sm:hidden mb-4">
                  <FullSparkline data={pintIndex.sparkData} snapshots={snapshots} width={260} height={50} />
                </div>

                {/* Stats strip — terminal aesthetic */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-light rounded-card overflow-hidden mb-4">
                  {[
                    { label: 'Average', value: `$${pintIndex.current.avg_price.toFixed(2)}` },
                    { label: 'Median', value: `$${pintIndex.current.median_price.toFixed(2)}` },
                    { label: 'All-time', value: `${pintIndex.yearPct >= 0 ? '+' : ''}${pintIndex.yearPct.toFixed(1)}%` },
                    { label: 'Range', value: `$${pintIndex.current.min_price.toFixed(0)}–$${pintIndex.current.max_price.toFixed(0)}` },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white px-3 py-2.5 text-center">
                      <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-gray-mid">{stat.label}</div>
                      <div className="font-mono text-base font-extrabold text-ink tabular-nums mt-0.5">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Suburb spread — gradient connector */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-green mb-0.5">▼ Cheapest</div>
                    <div className="font-mono text-sm font-extrabold text-ink truncate">{pintIndex.current.cheapest_suburb}</div>
                    <div className="font-mono text-xs text-gray-mid tabular-nums">${pintIndex.current.cheapest_suburb_avg.toFixed(2)}/pint</div>
                  </div>
                  <div className="w-12 sm:w-20 flex items-center">
                    <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-green via-amber to-red opacity-40" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-red mb-0.5">▲ Priciest</div>
                    <div className="font-mono text-sm font-extrabold text-ink truncate">{pintIndex.current.most_expensive_suburb}</div>
                    <div className="font-mono text-xs text-gray-mid tabular-nums">${pintIndex.current.most_expensive_suburb_avg.toFixed(2)}/pint</div>
                  </div>
                </div>

                {/* Distribution — horizontal bars */}
                {pintIndex.current.price_distribution && (() => {
                  const ranges = ['$6-7', '$7-8', '$8-9', '$9-10', '$10-11', '$11-12']
                  const values = ranges.map(r => pintIndex.current.price_distribution[r] || 0)
                  const maxVal = Math.max(...values, 1)
                  return (
                    <div className="mb-3">
                      <div className="space-y-1">
                        {ranges.map((range, i) => {
                          const count = values[i]
                          if (count === 0) return null
                          return (
                            <div key={range} className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-gray-mid w-8 text-right tabular-nums flex-shrink-0">{range}</span>
                              <div className="flex-1 h-3.5 bg-off-white rounded-sm overflow-hidden">
                                <div
                                  className="h-full rounded-sm"
                                  style={{
                                    width: `${(count / maxVal) * 100}%`,
                                    backgroundColor: i <= 1 ? '#D4740A' : i <= 3 ? '#F2A91A' : '#171717',
                                  }}
                                />
                              </div>
                              <span className="font-mono text-[10px] font-bold text-gray-mid w-6 text-right tabular-nums flex-shrink-0">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                <p className="font-mono text-[9px] text-gray-mid/60 text-center mt-2 uppercase tracking-wider">{pintIndex.current.total_suburbs} suburbs · Updated weekly</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-container mx-auto px-6">

        {/* ════════════════════════════════════════════
            1. HERO: Tonight's Quick Pick
            ════════════════════════════════════════════ */}
        {heroPub && (
          <section className="pt-8 sm:pt-10 mb-10 sm:mb-14">
            <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white py-10 px-6 text-center">
              <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid mb-2">Your best pint right now</p>
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <Beer className="w-5 h-5 text-amber" />
                <Link href={`/pub/${heroPub.slug}`} className="font-mono text-lg sm:text-xl font-extrabold text-ink hover:text-amber transition-colors no-underline">
                  {heroPub.name}
                </Link>
                <span className="text-gray-mid text-sm">{heroPub.suburb}</span>
                {userLocation && (
                  <span className="text-gray-mid text-sm">{formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, heroPub.lat, heroPub.lng))}</span>
                )}
              </div>
              <div className="font-mono text-[2.5rem] font-extrabold text-ink leading-none">
                ${heroPub.price!.toFixed(2)}
              </div>
              <p className="text-[0.75rem] text-gray-mid mt-1">{heroPub.beerType}</p>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            2. LIVE DEALS GRID
            ════════════════════════════════════════════ */}
        <section id="best-buys" className="mb-10 sm:mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left: Best Buys */}
            <div className="bg-white border-3 border-ink shadow-hard-sm rounded-card p-6">
              <h3 className="font-mono text-base font-extrabold text-ink mb-1"><Tag className="w-5 h-5 inline mr-1" />Best Buys</h3>
              <p className="text-sm text-gray-mid mb-4">Lowest prices right now</p>
              <div className="space-y-1">
                {bestBuys.slice(0, 5).map((pub, i) => (
                  <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2.5 rounded-card border-l-2 border-l-transparent hover:border-l-amber hover:bg-off-white transition-all group no-underline">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-sm font-bold text-gray-mid w-5">{i + 1}</span>
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-bold text-ink truncate block group-hover:text-amber transition-colors">{pub.name}</span>
                        <p className="text-xs text-gray-mid">
                          {pub.suburb}
                          {userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}
                          {' · '}{pub.beerType}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-lg font-extrabold text-ink tabular-nums flex-shrink-0">${pub.price!.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
              <Link href="/insights/tonights-best-bets" className="block mt-4 font-mono text-[0.75rem] font-bold text-amber hover:underline no-underline">
                View all →
              </Link>
            </div>

            {/* Right: Happy Hours */}
            <div className="bg-white border-3 border-ink shadow-hard-sm rounded-card p-6">
              <h3 className="font-mono text-base font-extrabold text-ink mb-1"><Clock className="w-4 h-4 inline" /> Happy Hours</h3>
              <p className="text-sm text-gray-mid mb-4">Starting soon near you</p>
              <div className="space-y-1">
                {upcomingHappyHours.length === 0 && (
                  <p className="text-sm text-gray-mid py-4 text-center">No happy hours active or upcoming right now. Check back later!</p>
                )}
                {upcomingHappyHours.map(({ pub, status }) => (
                  <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2.5 rounded-card border-l-2 border-l-transparent hover:border-l-amber hover:bg-off-white transition-all group no-underline">
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-bold text-ink truncate block group-hover:text-amber transition-colors">{pub.name}</span>
                      <p className="text-xs text-gray-mid">{pub.suburb}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${status.isActive ? 'bg-amber-pale text-amber border border-amber/30' : 'bg-off-white text-gray-mid border border-gray-light'}`}>
                        {status.countdown || status.statusText}
                      </span>
                      <span className="font-mono text-lg font-extrabold text-ink tabular-nums">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/happy-hour" className="block mt-4 font-mono text-[0.75rem] font-bold text-amber hover:underline no-underline">
                See all happy hours →
              </Link>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════
            3. PUB PICKS CAROUSEL
            ════════════════════════════════════════════ */}
        <section className="mb-10 sm:mb-14">
          <h2 className="font-mono font-extrabold text-xl tracking-[-0.02em] text-ink">Pub Picks</h2>
          <p className="text-sm text-gray-mid mt-1 mb-6">Pub lists for every mood</p>

          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pl-1 pb-4 pr-10 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>

              {[
                { emoji: 'sunset', title: 'Sunset Sippers', desc: 'West-facing patios and rooftop bars for golden hour pints.', bg: 'bg-amber-pale', count: pubPickCounts.sunset, href: '/guides/sunset-sippers' },
                { emoji: 'users', title: 'The Dad Bar', desc: 'No fairy lights, no craft beer menu. Just honest pints and the footy on.', bg: 'bg-white', count: pubPickCounts.dad, href: '/guides/dad-bar' },
                { emoji: 'sun', title: 'Beer Weather', desc: 'Live BOM data matched to beer garden picks. Is it a beer garden arvo?', bg: 'bg-green-pale', count: pubPickCounts.beer, href: '/guides/beer-weather' },
                { emoji: 'umbrella', title: 'Cozy Corners', desc: 'Fireplaces, booths, and warmth for when it\'s bucketing down.', bg: 'bg-white', count: pubPickCounts.cozy, href: '/guides/cozy-corners' },
                { emoji: 'trophy', title: 'Punt & Pints', desc: 'TAB screens, cold pints, and a flutter on the trots.', bg: 'bg-white', count: pubPickCounts.punt, href: '/guides/punt-and-pints' },
                { emoji: 'clock', title: 'Happy Hours', desc: 'Live deals happening right now across Perth.', bg: 'bg-amber-pale', count: pubPickCounts.happy, href: '/happy-hour' },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`${card.bg} w-[240px] sm:w-[280px] min-h-[200px] rounded-card border-3 border-ink shadow-hard-sm p-6 flex-shrink-0 snap-start hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all group no-underline`}
                >
                  <LucideIcon name={card.emoji} className="w-8 h-8" />
                  <h3 className="font-mono text-base font-extrabold text-ink mt-3 group-hover:text-amber transition-colors">{card.title}</h3>
                  <p className="text-sm text-gray-mid mt-1 leading-relaxed">{card.desc}</p>
                  <p className="font-mono text-[0.75rem] font-bold text-amber mt-4">{card.count} pubs →</p>
                </Link>
              ))}
            </div>
            {/* Right fade hint */}
            <div className="absolute right-0 top-0 bottom-4 w-12 pointer-events-none bg-gradient-to-l from-[#FDF8F0] to-transparent" />
          </div>
        </section>

        {/* ════════════════════════════════════════════
            4. CONTRIBUTE CTA BANNER
            ════════════════════════════════════════════ */}
        <section className="mb-10 sm:mb-14">
          <div className="bg-ink border-3 border-ink rounded-card p-6 text-center shadow-hard-sm">
            <h2 className="font-mono font-extrabold text-xl text-white mb-2">Know a price we&apos;re missing?</h2>
            <p className="text-white/60 text-sm mb-4">Help Perth drink cheaper.</p>
            <Link
              href="/?submit=1"
              className="inline-flex font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              Submit a Price
            </Link>
            <p className="text-white/40 text-sm mt-4">{pubs.length} venues tracked · Updated weekly</p>
          </div>
        </section>

      </div>

      <Footer />
    </main>
  )
}
