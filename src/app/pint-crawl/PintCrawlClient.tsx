'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import { Pub } from '@/types/pub'
import { Beer, MapPin, DollarSign, CircleCheck, Copy, Share2, Map as MapIcon, Zap, Shuffle, Pencil, Footprints, PartyPopper, Flag, AlertTriangle, Timer, Link as LinkIcon } from 'lucide-react'

/* ─── Haversine distance in km ─── */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function walkingMinutes(km: number): number {
  return Math.round((km / 5) * 60)
}

/* ─── Types ─── */
type Phase = 'plan' | 'route' | 'live'
type Area = 'near-me' | 'northbridge' | 'fremantle' | 'perth-cbd' | 'all'

interface RouteSegment {
  pub: Pub
  distFromPrev: number | null // km, null for first stop
}

const AREA_OPTIONS: { value: Area; label: string }[] = [
  { value: 'near-me', label: 'Near Me' },
  { value: 'northbridge', label: 'Northbridge' },
  { value: 'fremantle', label: 'Fremantle' },
  { value: 'perth-cbd', label: 'Perth CBD' },
  { value: 'all', label: 'All Perth' },
]

const STOP_OPTIONS = [3, 4, 5, 6, 7, 8]

/* ─── Component ─── */
export default function PintCrawlClient({ pubs }: { pubs: Pub[] }) {
  // Phase
  const [phase, setPhase] = useState<Phase>('plan')

  // Plan state
  const [budget, setBudget] = useState(60)
  const [stops, setStops] = useState(5)
  const [area, setArea] = useState<Area>('all')
  const [happyHourOnly, setHappyHourOnly] = useState(false)
  const [kidFriendly, setKidFriendly] = useState(false)
  const [tabVenues, setTabVenues] = useState(false)

  // Geolocation
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  // Route
  const [route, setRoute] = useState<RouteSegment[]>([])
  const [routeMessage, setRouteMessage] = useState<string | null>(null)

  // Live crawl
  const [currentStop, setCurrentStop] = useState(0)
  const [crawlStartTime, setCrawlStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // URL state
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Clipboard feedback
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  /* ─── Geolocation ─── */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(err.message)
        setGeoLoading(false)
        setArea('all')
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    if (area === 'near-me') {
      if (userLat === null) requestLocation()
    }
  }, [area, userLat, requestLocation])

  /* ─── Hydrate from URL params (shared link) ─── */
  const hydrated = useRef(false)
  useEffect(() => {
    if (hydrated.current || !searchParams) return
    hydrated.current = true

    const pubSlugs = searchParams.get('pubs')
    const urlArea = searchParams.get('area') as Area | null
    const urlBudget = searchParams.get('budget')
    const urlStops = searchParams.get('stops')

    if (pubSlugs) {
      const slugList = pubSlugs.split(',')
      if (urlArea) setArea(urlArea)
      if (urlBudget) setBudget(Number(urlBudget))
      if (urlStops) setStops(Number(urlStops))

      // Build route from shared pub slugs
      const slugToPub = new Map(pubs.map(p => [p.slug, p]))
      const matchedPubs = slugList
        .map(slug => slugToPub.get(slug))
        .filter((p): p is Pub => p !== undefined && p.price !== null)

      if (matchedPubs.length > 0) {
        const segments: RouteSegment[] = matchedPubs.map((pub, i) => ({
          pub,
          distFromPrev: i === 0
            ? null
            : getDistance(matchedPubs[i - 1].lat, matchedPubs[i - 1].lng, pub.lat, pub.lng),
        }))
        setRoute(segments)
        setPhase('route')
      }
    }
  }, [searchParams, pubs])

  /* ─── Live crawl timer ─── */
  useEffect(() => {
    if (phase === 'live' && crawlStartTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - crawlStartTime) / 1000))
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, crawlStartTime])

  /* ─── Derived values ─── */
  const filteredPubs = pubs.filter((p) => {
    if (p.price === null) return false
    if (happyHourOnly && !p.isHappyHourNow) return false
    if (kidFriendly && !p.kidFriendly) return false
    if (tabVenues && !p.hasTab) return false

    if (area === 'near-me' && userLat !== null && userLng !== null) {
      return getDistance(userLat, userLng, p.lat, p.lng) <= 5
    }
    if (area === 'northbridge') {
      return p.suburb.toLowerCase().includes('northbridge')
    }
    if (area === 'fremantle') {
      return p.suburb.toLowerCase().includes('fremantle')
    }
    if (area === 'perth-cbd') {
      const s = p.suburb.toLowerCase()
      return s.includes('perth') && !s.includes('north') && !s.includes('south') && !s.includes('east') && !s.includes('west')
    }
    return true // 'all'
  })

  const avgPrice =
    filteredPubs.length > 0
      ? filteredPubs.reduce((s, p) => s + (p.price ?? 0), 0) / filteredPubs.length
      : 10
  const estimatedPints = Math.floor(budget / avgPrice)

  const cheapestPrice =
    filteredPubs.length > 0
      ? Math.min(...filteredPubs.map((p) => p.price ?? Infinity))
      : 0
  const tightBudget = stops * cheapestPrice > budget

  /* ─── Route generation ─── */
  const generateRoute = useCallback(
    (shuffle = false) => {
      setRouteMessage(null)
      let candidates = [...filteredPubs]

      if (shuffle) {
        // Fisher-Yates shuffle to randomize selection
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
        }
      }

      // Sort by price ascending (cheapest first)
      candidates.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))

      if (shuffle) {
        // After shuffle, take a different approach: group by price bands and randomly pick
        const priceGroups: Pub[][] = []
        let currentGroup: Pub[] = []
        let lastPrice = -1
        for (const pub of candidates) {
          const price = pub.price ?? 0
          if (currentGroup.length === 0 || Math.abs(price - lastPrice) <= 1.5) {
            currentGroup.push(pub)
          } else {
            priceGroups.push(currentGroup)
            currentGroup = [pub]
          }
          lastPrice = price
        }
        if (currentGroup.length > 0) priceGroups.push(currentGroup)

        // Shuffle within each price group
        const shuffled: Pub[] = []
        for (const group of priceGroups) {
          for (let i = group.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[group[i], group[j]] = [group[j], group[i]]
          }
          shuffled.push(...group)
        }
        candidates = shuffled
      }

      // Pick stops within budget
      let selected: Pub[] = []
      let totalCost = 0
      const targetStops = stops

      for (const pub of candidates) {
        if (selected.length >= targetStops) break
        const price = pub.price ?? 0
        if (totalCost + price <= budget) {
          selected.push(pub)
          totalCost += price
        }
      }

      if (selected.length === 0) {
        setRouteMessage('No pubs match your criteria. Try widening your area or increasing your budget.')
        return
      }

      if (selected.length < targetStops) {
        setRouteMessage(
          `Could only find ${selected.length} stops within your $${budget} budget. Showing best options.`
        )
      }

      // Nearest-neighbor geographic sort
      const ordered: Pub[] = []
      const remaining = [...selected]
      let current = remaining.shift()!
      ordered.push(current)

      while (remaining.length > 0) {
        let nearestIdx = 0
        let nearestDist = Infinity
        for (let i = 0; i < remaining.length; i++) {
          const d = getDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng)
          if (d < nearestDist) {
            nearestDist = d
            nearestIdx = i
          }
        }
        current = remaining.splice(nearestIdx, 1)[0]
        ordered.push(current)
      }

      // Build route segments
      const segments: RouteSegment[] = ordered.map((pub, i) => ({
        pub,
        distFromPrev:
          i === 0
            ? null
            : getDistance(ordered[i - 1].lat, ordered[i - 1].lng, pub.lat, pub.lng),
      }))

      setRoute(segments)
      setPhase('route')

      // Sync route to URL for shareability
      const params = new URLSearchParams()
      params.set('pubs', ordered.map(p => p.slug).join(','))
      params.set('area', area)
      params.set('budget', String(budget))
      params.set('stops', String(stops))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [filteredPubs, stops, budget, area, router, pathname]
  )

  /* ─── Route stats ─── */
  const totalCost = route.reduce((s, seg) => s + (seg.pub.price ?? 0), 0)
  const totalDistance = route.reduce((s, seg) => s + (seg.distFromPrev ?? 0), 0)
  const totalWalkMin = walkingMinutes(totalDistance)
  const budgetRemaining = budget - totalCost

  const happyHourSavings = route.reduce((s, seg) => {
    const pub = seg.pub
    if (pub.isHappyHourNow && pub.regularPrice && pub.price) {
      return s + (pub.regularPrice - pub.price)
    }
    return s
  }, 0)

  /* ─── Live crawl ─── */
  const startCrawl = () => {
    setCrawlStartTime(Date.now())
    setCurrentStop(0)
    setCompletedStops(new Set())
    setPhase('live')
  }

  const advanceStop = () => {
    setCompletedStops((prev) => new Set(prev).add(currentStop))
    if (currentStop < route.length - 1) {
      setCurrentStop((i) => i + 1)
    } else {
      setCurrentStop(route.length) // signals completion
    }
  }

  const runningSpend = route
    .slice(0, currentStop + 1)
    .filter((_, i) => completedStops.has(i) || i === currentStop)
    .reduce((s, seg) => s + (seg.pub.price ?? 0), 0)

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const sec = secs % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${sec.toString().padStart(2, '0')}s`
  }

  /* ─── Share / Copy ─── */
  const getShareUrl = () => {
    const params = new URLSearchParams()
    params.set('pubs', route.map(s => s.pub.slug).join(','))
    params.set('area', area)
    params.set('budget', String(budget))
    params.set('stops', String(stops))
    return `https://perthpintprices.com/pint-crawl?${params.toString()}`
  }

  const shareText = () => {
    const pubNames = route.map((s) => s.pub.name).join(' → ')
    const areaLabel =
      area === 'near-me'
        ? 'Near Me'
        : area === 'all'
          ? 'All Perth'
          : area === 'northbridge'
            ? 'Northbridge'
            : area === 'fremantle'
              ? 'Fremantle'
              : 'Perth CBD'
    return `Arvo Pint Crawl\n\nRoute: ${pubNames}\nArea: ${areaLabel}\nTotal: $${totalCost.toFixed(2)} for ${route.length} pints\nWalking: ~${totalDistance.toFixed(1)}km (${totalWalkMin}min)\n\n${getShareUrl()}`
  }

  const shareCrawl = async () => {
    const url = getShareUrl()
    // Try native Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Arvo Pint Crawl: ${route.length} stops`,
          text: `Check out this pub crawl: ${route.map(s => s.pub.name).join(' → ')} - $${totalCost.toFixed(2)} total`,
          url,
        })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
        return
      } catch {
        // User cancelled or API failed - fall through to clipboard
      }
    }
    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent fail
    }
  }

  const copyRoute = async () => {
    try {
      await navigator.clipboard.writeText(shareText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  /* ═══════════════════════════════════════════════ */
  /* ─── RENDER ─── */
  /* ═══════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <SubPageNav title="Pint Crawl" subtitle="Plan your route" />

      <main className="max-w-container mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px]" style={{ background: '#3B82F6' }} />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Plan</span>
          </div>
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1]">
            Pint Crawl
          </h1>
          <p className="text-gray-mid text-[0.85rem] mt-1">Plan your route</p>
        </div>
        {/* ════════════ SCREEN 1: PLAN ════════════ */}
        {phase === 'plan' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Budget */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink mono">
                  <DollarSign className="w-4 h-4 inline" /> Budget per person
                </h2>
                <span className="text-2xl font-bold text-ink mono">
                  ${budget}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={150}
                step={5}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-pill appearance-none cursor-pointer accent-orange"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
                <span>$20</span>
                <span>$150</span>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                ≈ {estimatedPints} pints at avg $
                {avgPrice.toFixed(2)}
              </p>
            </div>

            {/* Number of stops */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink mono mb-3">
                <Beer className="w-4 h-4 inline" /> Number of stops
              </h2>
              <div className="flex flex-wrap gap-2">
                {STOP_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setStops(n)}
                    className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all ${
                      stops === n
                        ? 'bg-ink text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {tightBudget && filteredPubs.length > 0 && (
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  <AlertTriangle className="w-3 h-3 inline mr-1" /> Tight budget for {stops} stops!
                </p>
              )}
            </div>

            {/* Area selector */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink mono mb-3">
                <MapPin className="w-4 h-4 inline" /> Where?
              </h2>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setArea(opt.value)}
                    className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all ${
                      area === opt.value
                        ? 'bg-ink text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {area === 'near-me' && geoLoading && (
                <p className="text-xs text-stone-500 mt-2">Getting your location…</p>
              )}
              {area === 'near-me' && geoError && (
                <p className="text-xs text-red-500 mt-2">
                  Location error: {geoError}. Showing all Perth instead.
                </p>
              )}
              {area === 'near-me' && userLat !== null && (
                <p className="text-xs text-stone-500 mt-2">
                  Showing pubs within 5km · {filteredPubs.length} found
                </p>
              )}
              {area !== 'near-me' && area !== 'all' && (
                <p className="text-xs text-stone-500 mt-2">
                  {filteredPubs.length} pub{filteredPubs.length !== 1 ? 's' : ''} in{' '}
                  {area === 'northbridge'
                    ? 'Northbridge'
                    : area === 'fremantle'
                      ? 'Fremantle'
                      : 'Perth CBD'}
                </p>
              )}
            </div>

            {/* Options toggles */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-ink mono mb-3">
                Options
              </h2>
              <div className="space-y-3">
                <ToggleRow
                  label="Happy Hour only"
                  checked={happyHourOnly}
                  onChange={setHappyHourOnly}
                />
                <ToggleRow
                  label="Kid-friendly"
                  checked={kidFriendly}
                  onChange={setKidFriendly}
                />
                <ToggleRow
                  label="TAB venues"
                  checked={tabVenues}
                  onChange={setTabVenues}
                />
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={() => generateRoute(false)}
              disabled={filteredPubs.length === 0}
              className="w-full bg-ink text-white mono font-bold text-base rounded-2xl py-4 hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Beer className="w-4 h-4 inline" /> Generate Route
            </button>
            {filteredPubs.length === 0 && (
              <p className="text-center text-xs text-stone-500">
                No pubs match your filters. Try adjusting your options.
              </p>
            )}
          </div>
        )}

        {/* ════════════ SCREEN 2: ROUTE ════════════ */}
        {phase === 'route' && (
          <div className="space-y-3 sm:space-y-4">
            {routeMessage && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 text-sm text-orange-800">
                {routeMessage}
              </div>
            )}

            {/* Route overview */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
                <span className="font-semibold text-ink mono">
                  {route.length} stops
                </span>
                <span>·</span>
                <span>~{totalDistance.toFixed(1)}km walk</span>
                <span>·</span>
                <span>Est. ${totalCost.toFixed(2)}</span>
              </div>
              <p
                className={`text-sm font-semibold mt-1 ${
                  budgetRemaining >= 0 ? 'text-ink' : 'text-red-600'
                }`}
              >
                {budgetRemaining >= 0
                  ? `Under budget by $${budgetRemaining.toFixed(2)}`
                  : `Over budget by $${Math.abs(budgetRemaining).toFixed(2)}`}
              </p>
            </div>

            {/* Route list */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <div className="space-y-0">
                {route.map((seg, i) => (
                  <div key={seg.pub.id}>
                    {/* Walking segment */}
                    {seg.distFromPrev !== null && (
                      <div className="flex items-center gap-3 py-2 pl-4">
                        <div className="w-px h-6 bg-stone-200 ml-[3px]" />
                        <span className="text-xs text-stone-400">
                          ~{walkingMinutes(seg.distFromPrev)} min walk (
                          {seg.distFromPrev >= 1
                            ? `${seg.distFromPrev.toFixed(1)}km`
                            : `${Math.round(seg.distFromPrev * 1000)}m`}
                          )
                        </span>
                      </div>
                    )}
                    {/* Pub stop */}
                    <Link
                      href={`/pub/${seg.pub.slug}`}
                      className="flex items-start gap-3 p-3 -mx-1 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-pill bg-ink text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-ink mono truncate">
                          {seg.pub.name}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {seg.pub.suburb} ·{' '}
                          <span className="font-semibold text-ink">
                            ${seg.pub.price?.toFixed(2) ?? 'TBC'}
                          </span>
                          {seg.pub.beerType && (
                            <span> · {seg.pub.beerType}</span>
                          )}
                        </p>
                        {seg.pub.isHappyHourNow && seg.pub.happyHourLabel && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-pill bg-orange-100 text-orange-800 text-[10px] font-semibold">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-pill bg-orange-500 opacity-75" />
                              <span className="relative inline-flex rounded-pill h-1.5 w-1.5 bg-orange-500" />
                            </span>
                            NOW! {seg.pub.happyHourLabel}
                          </span>
                        )}
                        {!seg.pub.isHappyHourNow && seg.pub.happyHour && (
                          <p className="text-[10px] text-stone-400 mt-1">
                            <Beer className="w-3 h-3 inline" /> {seg.pub.happyHour}
                          </p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Route stats */}
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-ink mono mb-3">
                Route Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Total cost" value={`$${totalCost.toFixed(2)}`} />
                <StatBox
                  label="Walking"
                  value={`~${totalDistance.toFixed(1)}km`}
                />
                <StatBox label="Walk time" value={`~${totalWalkMin}min`} />
                <StatBox
                  label="Budget left"
                  value={`$${Math.max(0, budgetRemaining).toFixed(2)}`}
                  accent={budgetRemaining >= 0}
                />
                {happyHourSavings > 0 && (
                  <StatBox
                    label="HH savings"
                    value={`$${happyHourSavings.toFixed(2)}`}
                    accent
                  />
                )}
              </div>
            </div>

            {/* Share link */}
            <button
              onClick={shareCrawl}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 border-2 border-amber-200 rounded-2xl py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              {shared ? <><CircleCheck className="w-4 h-4" /> Shared!</> : copied ? <><CircleCheck className="w-4 h-4" /> Link Copied!</> : <><LinkIcon className="w-4 h-4" /> Share This Crawl</>}
            </button>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => generateRoute(true)}
                className="flex items-center justify-center gap-2 bg-white border border-stone-200/60 rounded-2xl py-3 text-sm font-semibold text-ink hover:bg-stone-50 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" /> Shuffle
              </button>
              <button
                onClick={copyRoute}
                className="flex items-center justify-center gap-2 bg-white border border-stone-200/60 rounded-2xl py-3 text-sm font-semibold text-ink hover:bg-stone-50 transition-colors"
              >
                {copied ? <><CircleCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Route</>}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPhase('plan')}
                className="flex items-center justify-center gap-2 bg-white border border-stone-200/60 rounded-2xl py-3 text-sm font-semibold text-ink hover:bg-stone-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Plan
              </button>
              <button
                onClick={startCrawl}
                className="flex items-center justify-center gap-2 bg-ink text-white rounded-2xl py-3 text-sm font-bold hover:bg-ink/90 transition-colors"
              >
                <Footprints className="w-3.5 h-3.5" /> Start Crawl
              </button>
            </div>
          </div>
        )}

        {/* ════════════ SCREEN 3: LIVE CRAWL ════════════ */}
        {phase === 'live' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Crawl completed */}
            {currentStop >= route.length ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-6 sm:p-8 text-center">
                  <div className="flex justify-center mb-3"><PartyPopper className="w-12 h-12 text-amber-500" /></div>
                  <h2 className="text-xl font-bold mono text-ink mb-1">
                    Crawl Complete!
                  </h2>
                  <p className="text-sm text-stone-500">
                    You absolute legend. Here&apos;s your stats:
                  </p>
                </div>

                <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Pubs visited"
                      value={`${route.length}`}
                    />
                    <StatBox
                      label="Total spent"
                      value={`$${totalCost.toFixed(2)}`}
                    />
                    <StatBox
                      label="Time"
                      value={formatTime(elapsed)}
                    />
                    <StatBox
                      label="Walking"
                      value={`~${totalDistance.toFixed(1)}km`}
                    />
                    <StatBox
                      label="Budget left"
                      value={`$${Math.max(0, budgetRemaining).toFixed(2)}`}
                      accent={budgetRemaining >= 0}
                    />
                    {happyHourSavings > 0 && (
                      <StatBox
                        label="HH savings"
                        value={`$${happyHourSavings.toFixed(2)}`}
                        accent
                      />
                    )}
                  </div>
                </div>

                <button
                  onClick={shareCrawl}
                  className="w-full flex items-center justify-center gap-2 bg-ink text-white rounded-2xl py-4 text-sm font-bold hover:bg-ink/90 transition-colors"
                >
                  {shared ? <><CircleCheck className="w-3.5 h-3.5" /> Shared!</> : copied ? <><CircleCheck className="w-3.5 h-3.5" /> Link Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share Your Crawl</>}
                </button>
                <button
                  onClick={() => {
                    setPhase('plan')
                    setRoute([])
                    setCrawlStartTime(null)
                    setElapsed(0)
                    setCurrentStop(0)
                    setCompletedStops(new Set())
                    router.replace(pathname, { scroll: false })
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-stone-200/60 rounded-2xl py-3 text-sm font-semibold text-ink hover:bg-stone-50 transition-colors"
                >
                  <MapIcon className="w-4 h-4 inline" /> Plan Another Crawl
                </button>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-stone-500">
                      Stop {currentStop + 1} of {route.length}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Timer className="w-3 h-3" /> {formatTime(elapsed)}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-pill h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-pill transition-all duration-500"
                      style={{
                        width: `${((currentStop + 1) / route.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
                    <span>
                      Spent: ${runningSpend.toFixed(2)}
                    </span>
                    <span>
                      Left: ${Math.max(0, budget - runningSpend).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Current stop */}
                <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-5 sm:p-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-pill bg-ink text-white text-2xl font-bold mono mb-3">
                      {currentStop + 1}
                    </div>
                    <h2 className="text-lg font-bold mono text-ink">
                      {route[currentStop].pub.name}
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      {route[currentStop].pub.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xl font-bold text-ink mono">
                        ${route[currentStop].pub.price?.toFixed(2) ?? 'TBC'}
                      </div>
                      <div className="text-xs text-stone-500">pint price</div>
                    </div>
                    {route[currentStop].pub.beerType && (
                      <div className="text-center">
                        <div className="text-sm font-semibold text-ink">
                          <Beer className="w-3 h-3 inline" /> {route[currentStop].pub.beerType}
                        </div>
                        <div className="text-xs text-stone-500">cheapest</div>
                      </div>
                    )}
                  </div>

                  {route[currentStop].pub.isHappyHourNow &&
                    route[currentStop].pub.happyHourLabel && (
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-orange-100 text-orange-800 text-xs font-semibold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-pill bg-orange-500 opacity-75" />
                            <span className="relative inline-flex rounded-pill h-2 w-2 bg-orange-500" />
                          </span>
                          NOW! {route[currentStop].pub.happyHourLabel}
                        </span>
                      </div>
                    )}
                </div>

                {/* Next stop preview */}
                {currentStop < route.length - 1 && (
                  <div className="bg-stone-50 border-3 border-ink rounded-card shadow-hard-sm p-3 sm:p-4">
                    <p className="text-xs text-stone-500 mb-1">Next up:</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink mono">
                          {route[currentStop + 1].pub.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {route[currentStop + 1].pub.suburb} · $
                          {route[currentStop + 1].pub.price?.toFixed(2) ?? 'TBC'}
                        </p>
                      </div>
                      {route[currentStop + 1].distFromPrev !== null && (
                        <span className="text-xs text-stone-400">
                          ~{walkingMinutes(route[currentStop + 1].distFromPrev!)} min walk
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stop progress dots */}
                <div className="flex items-center justify-center gap-1.5 py-1">
                  {route.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-pill transition-all ${
                        completedStops.has(i)
                          ? 'bg-orange-500'
                          : i === currentStop
                            ? 'bg-orange-500 scale-125'
                            : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Advance button */}
                <button
                  onClick={advanceStop}
                  className="w-full bg-ink text-white mono font-bold text-base rounded-2xl py-4 hover:bg-ink/90 transition-colors"
                >
                  {currentStop < route.length - 1
                    ? <><CircleCheck className="w-3.5 h-3.5 inline" /> Done. Next Stop</>
                    : <><Flag className="w-3.5 h-3.5 inline" /> Finish Crawl!</>}
                </button>

                {/* Back to route button */}
                <button
                  onClick={() => setPhase('route')}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-stone-200/60 rounded-2xl py-3 text-sm font-semibold text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  ← View Full Route
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── Toggle row ─── */
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-stone-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors ${
          checked ? 'bg-orange-500' : 'bg-stone-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-pill bg-white transition-transform shadow-sm ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}

/* ─── Stat box ─── */
function StatBox({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 text-center">
      <div
        className={`text-base font-bold mono ${
          accent ? 'text-ink' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-stone-500 mt-0.5">{label}</div>
    </div>
  )
}
