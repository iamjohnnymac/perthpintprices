'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { getPubs } from '@/lib/supabase'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { pubUrl } from '@/lib/urls'
import { getHappyHourStatus, formatHappyHourDays, type HappyHourStatus } from '@/lib/happyHourLive'
import { getPriceRecency } from '@/lib/freshness'

type SortMode = 'price' | 'nearest'

interface HappyHourClientProps {
  initialPubs: Pub[]
  renderedAtIso: string
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'TBC'
  return Number.isInteger(price) ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}

function formatPerthTime(date: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(' ', '').toLowerCase()
}

function getPubHappyHourStatus(pub: Pub, now: Date): HappyHourStatus {
  return getHappyHourStatus({
    price: pub.regularPrice,
    happyHourPrice: pub.happyHourPrice,
    happyHourDays: pub.happyHourDays,
    happyHourStart: pub.happyHourStart,
    happyHourEnd: pub.happyHourEnd,
  }, now)
}

function hasTimedHappyHour(pub: Pub): boolean {
  return Boolean(pub.happyHourDays && pub.happyHourStart && pub.happyHourEnd)
}

function getActiveDisplayPrice(pub: Pub, status: HappyHourStatus): number | null {
  return status.effectivePrice ?? pub.price ?? pub.happyHourPrice ?? pub.regularPrice
}

function formatDealWindow(pub: Pub, status: HappyHourStatus): string {
  if (status.happyHourLabel) return status.happyHourLabel
  const days = formatHappyHourDays(pub.happyHourDays)
  if (days) return days
  return pub.happyHour ?? 'Happy hour'
}

export default function HappyHourClient({ initialPubs, renderedAtIso }: HappyHourClientProps) {
  const [happyHourPubs, setHappyHourPubs] = useState<Pub[]>(initialPubs)
  const [allPubs, setAllPubs] = useState<Pub[]>(initialPubs.filter(p => p.isHappyHourNow))
  const [loading, setLoading] = useState(false) // Start as false since we have server data
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [clockInstant, setClockInstant] = useState(() => new Date(renderedAtIso))
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationState, setLocationState] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [sortMode, setSortMode] = useState<SortMode>('price')

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationState('granted')
          setSortMode('nearest')
        },
        () => setLocationState('denied'),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
  }, [])

  const fetchPubs = useCallback(async () => {
    try {
      const pubs = await getPubs()
      const pubsWithHappyHours = pubs.filter((p) => p.happyHour)
      setHappyHourPubs(pubsWithHappyHours)
      setAllPubs(pubsWithHappyHours.filter((p) => p.isHappyHourNow))
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching happy hour pubs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Don't fetch immediately — we already have server-rendered data via initialPubs.
    // Only set up the 60s refresh interval for live updates.
    const interval = setInterval(fetchPubs, 60_000)
    return () => clearInterval(interval)
  }, [fetchPubs])

  useEffect(() => {
    const interval = setInterval(() => setClockInstant(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const pubs = useMemo(() => {
    const sorted = [...allPubs]
    if (sortMode === 'nearest' && userLocation) {
      sorted.sort((a, b) => {
        const distA = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng)
        const distB = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        return distA - distB
      })
    } else {
      sorted.sort((a, b) => {
        const priceA = a.happyHourPrice ?? a.price ?? a.regularPrice ?? 999
        const priceB = b.happyHourPrice ?? b.price ?? b.regularPrice ?? 999
        return priceA - priceB
      })
    }
    return sorted
  }, [allPubs, sortMode, userLocation])

  const planner = useMemo(() => {
    const rows = happyHourPubs.map(pub => ({
      pub,
      status: getPubHappyHourStatus(pub, clockInstant),
    }))
    const pricedRows = rows.filter(row => row.pub.happyHourPrice != null)
    const timedRows = rows.filter(row => hasTimedHappyHour(row.pub))
    const activeRows = rows
      .filter(row => row.status.isActive && getActiveDisplayPrice(row.pub, row.status) != null)
      .sort((a, b) => (getActiveDisplayPrice(a.pub, a.status) ?? 999) - (getActiveDisplayPrice(b.pub, b.status) ?? 999))
    const upcomingRows = pricedRows
      .filter(row => !row.status.isActive && row.status.startsInMinutes != null)
      .sort((a, b) => {
        const startDiff = (a.status.startsInMinutes ?? 9999) - (b.status.startsInMinutes ?? 9999)
        if (startDiff !== 0) return startDiff
        return (a.pub.happyHourPrice ?? 999) - (b.pub.happyHourPrice ?? 999)
      })
    const laterRows = pricedRows
      .filter(row => !row.status.isActive && row.status.startsInMinutes == null && hasTimedHappyHour(row.pub))
      .sort((a, b) => (a.pub.happyHourPrice ?? 999) - (b.pub.happyHourPrice ?? 999))
    const freshCount = happyHourPubs.filter(pub => {
      const recency = getPriceRecency(pub.lastVerified ?? pub.priceVerifiedAt)
      return recency.tier === 'fresh'
    }).length

    return {
      activeCount: activeRows.length,
      timedCount: timedRows.length,
      freshCount,
      cheapestActive: activeRows[0] ?? null,
      nextDeal: upcomingRows[0] ?? null,
      laterDeal: laterRows[0] ?? null,
    }
  }, [happyHourPubs, clockInstant])

  const formatMinutesRemaining = (mins: number | null): string => {
    if (mins == null) return ''
    if (mins < 1) return 'Ending soon'
    if (mins < 60) return `${mins}m left`
    const hours = Math.floor(mins / 60)
    const remainder = mins % 60
    if (remainder === 0) return `${hours}h left`
    return `${hours}h ${remainder}m left`
  }

  const hasLocation = locationState === 'granted' && userLocation !== null

  const minHhPrice = pubs.reduce((min, p) => {
    const pr = p.happyHourPrice ?? p.price ?? p.regularPrice
    return pr != null && pr < min ? pr : min
  }, Infinity)
  const activePubCopy = pubs.length === 1 ? 'one happy-hour pub' : `${pubs.length} happy-hour pubs`

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Happy Hours" />

      <div className="max-w-container mx-auto px-6 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-normal text-ink leading-[1.1]">
            Perth happy hours, on now
          </h1>

          {!loading && pubs.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(45,122,61,0.5)] animate-pulse" />
              <span className="font-mono text-[0.75rem] font-bold text-ink">
                {pubs.length} active now
              </span>
            </div>
          )}

          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mt-3">
            {pubs.length > 0 ? (
              <>Perth has {activePubCopy} running right now{minHhPrice !== Infinity && <>, with pints from <span className="font-mono font-bold text-ink">{formatPrice(minHhPrice)}</span></>}. We list them live, with the pint price, the window, and the last check where we have it.</>
            ) : (
              <>No happy hours we&apos;ve confirmed running right now. They move around — check back later, or <Link href="/discover" className="text-amber font-bold hover:underline">see Perth prices</Link>.</>
            )}
          </p>

          {lastRefresh && !loading && (
            <p className="text-gray-mid text-[0.7rem] mt-2">
              Auto-refreshes every 60s
            </p>
          )}
        </div>

        {happyHourPubs.length > 0 && (
          <section className="mb-6 overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <div className="border-b border-gray-light bg-off-white px-5 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] text-gray-mid">
                    {formatPerthTime(clockInstant)} AWST
                  </p>
                  <h2 className="font-mono text-[1.15rem] font-extrabold leading-tight text-ink">
                    Tonight&apos;s happy-hour board
                  </h2>
                </div>
                <p className="font-body text-[0.75rem] text-gray-mid">
                  {planner.timedCount} timed {planner.timedCount === 1 ? 'deal' : 'deals'} from {happyHourPubs.length} happy-hour {happyHourPubs.length === 1 ? 'pub' : 'pubs'}.
                </p>
              </div>
            </div>

            <div className="grid gap-0 sm:grid-cols-3">
              <div className="border-b border-gray-light p-5 sm:border-b-0 sm:border-r">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.05em] text-gray-mid">
                  Live
                </p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-ink">
                  {planner.activeCount}
                </p>
                {planner.cheapestActive ? (
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">
                    Cheapest active: <Link href={pubUrl(planner.cheapestActive.pub)} className="font-bold text-ink hover:text-amber hover:underline">{planner.cheapestActive.pub.name}</Link> in {planner.cheapestActive.pub.suburb}, {formatPrice(getActiveDisplayPrice(planner.cheapestActive.pub, planner.cheapestActive.status))}. Window: {formatDealWindow(planner.cheapestActive.pub, planner.cheapestActive.status)}.
                  </p>
                ) : (
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">
                    Nothing priced is live in the timed deals right now.
                  </p>
                )}
              </div>

              <div className="border-b border-gray-light p-5 sm:border-b-0 sm:border-r">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.05em] text-gray-mid">
                  Next
                </p>
                {planner.nextDeal ? (
                  <>
                    <p className="mt-2 font-mono text-[1.45rem] font-extrabold leading-tight text-ink">
                      {planner.nextDeal.status.countdown ?? 'Later today'}
                    </p>
                    <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">
                      <Link href={pubUrl(planner.nextDeal.pub)} className="font-bold text-ink hover:text-amber hover:underline">{planner.nextDeal.pub.name}</Link>, {planner.nextDeal.pub.suburb}. {formatPrice(planner.nextDeal.pub.happyHourPrice)} during {formatDealWindow(planner.nextDeal.pub, planner.nextDeal.status)}.
                    </p>
                  </>
                ) : planner.laterDeal ? (
                  <>
                    <p className="mt-2 font-mono text-[1.45rem] font-extrabold leading-tight text-ink">
                      Later in the week
                    </p>
                    <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">
                      Cheapest scheduled deal: <Link href={pubUrl(planner.laterDeal.pub)} className="font-bold text-ink hover:text-amber hover:underline">{planner.laterDeal.pub.name}</Link>, {formatPrice(planner.laterDeal.pub.happyHourPrice)} on {formatDealWindow(planner.laterDeal.pub, planner.laterDeal.status)}.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">
                    No later start time in the timed deals for today.
                  </p>
                )}
              </div>

              <div className="p-5">
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.05em] text-gray-mid">
                  Freshness
                </p>
                <p className="mt-2 font-mono text-[1.45rem] font-extrabold leading-tight text-ink">
                  {planner.freshCount}/{happyHourPubs.length}
                </p>
                <p className="mt-2 text-[0.78rem] leading-relaxed text-gray-mid">
                  Checked in the last 30 days. For the day-by-day view, read <Link href="/articles/perth-happy-hours-by-day" className="font-bold text-amber hover:underline">Perth happy hours by day</Link>, or use <Link href="/discover" className="font-bold text-amber hover:underline">Discover</Link> when the board is quiet.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Sort Controls */}
        {!loading && pubs.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSortMode('price')}
              className={`font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-pill px-5 py-2.5 transition-all ${
                sortMode === 'price'
                  ? 'bg-ink text-white shadow-hard-sm'
                  : 'bg-white text-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
              }`}
            >
              Cheapest
            </button>
            {hasLocation && (
              <button
                onClick={() => setSortMode(sortMode === 'nearest' ? 'price' : 'nearest')}
                className={`font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-pill px-5 py-2.5 transition-all ${
                  sortMode === 'nearest'
                    ? 'bg-ink text-white shadow-hard-sm'
                    : 'bg-white text-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
                }`}
              >
                Nearest
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 border-4 border-gray border-t-amber rounded-full animate-spin" />
            <span className="text-gray-mid font-medium">Loading happy hours...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && pubs.length === 0 && (
          <div className="border-3 border-ink rounded-card p-8 text-center shadow-hard-sm">
            <h2 className="font-mono font-extrabold text-xl text-ink mb-3">
              No happy hours right now
            </h2>
            <p className="text-gray-mid text-sm mb-6 max-w-md mx-auto leading-relaxed">
              The board above shows later starts where we have days and times. Otherwise, use the full price list and keep the pint honest.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              See Perth prices
            </Link>
          </div>
        )}

        {/* Pub List */}
        {!loading && pubs.length > 0 && (
          <div className="space-y-0">
            {pubs.map((pub, i) => {
              const savings = pub.happyHourPrice != null
                ? (pub.regularPrice ?? 0) - pub.happyHourPrice
                : 0
              const distance = userLocation
                ? getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)
                : null

              return (
                <Link
                  key={pub.id}
                  href={pubUrl(pub)}
                  className={`flex items-center gap-4 py-4 no-underline group ${
                    i < pubs.length - 1 ? 'border-b border-gray-light' : ''
                  }`}
                >
                  {/* Rank */}
                  <span className="font-mono text-[0.75rem] font-bold text-gray-mid w-6 text-right flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.85rem] font-extrabold text-ink group-hover:text-amber transition-colors truncate">
                        {pub.name}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider bg-red-pale text-red border border-red flex-shrink-0">
                        HH
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.75rem] text-gray-mid mt-0.5">
                      <span>{pub.suburb}</span>
                      {distance != null && (
                        <span>· {formatDistance(distance)}</span>
                      )}
                      {pub.happyHourLabel && (
                        <span>· {pub.happyHourLabel}</span>
                      )}
                    </div>
                    {pub.happyHourMinutesRemaining != null && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[0.65rem] font-bold text-red">
                        <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                        {formatMinutesRemaining(pub.happyHourMinutesRemaining)}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    {pub.happyHourPrice != null ? (
                      <>
                        <span className="font-mono text-[1.3rem] font-extrabold text-ink">
                          {formatPrice(pub.happyHourPrice)}
                        </span>
                        {pub.regularPrice != null && (
                          <div className="text-[0.7rem] text-gray-mid line-through">
                            {formatPrice(pub.regularPrice)}
                          </div>
                        )}
                        {savings > 0 && (
                          <div className="text-[0.65rem] font-bold text-green">
                            Save {formatPrice(savings)}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="font-mono text-[1.3rem] font-extrabold text-ink">
                        {formatPrice(pub.price)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && pubs.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              See Perth prices
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
