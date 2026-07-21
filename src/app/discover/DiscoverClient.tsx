'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'
import { getHappyHourStatus, type HappyHourStatus } from '@/lib/happyHourLive'
import { getDistanceKm, formatDistance } from '@/lib/location'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { Beer, Clock, Tag, Star } from 'lucide-react'
import LucideIcon from '@/components/LucideIcon'
import { pubUrl } from '@/lib/urls'
import { isDadBar } from '@/lib/pubPicks'
import ArticleRail from '@/components/ArticleRail'
import { DISCOVER_BEST_BUYS_HREF } from '@/lib/internalLinks'

function getPubHappyHourStatus(pub: Pub, now: Date): HappyHourStatus {
  return getHappyHourStatus({
    price: pub.regularPrice,
    happyHourPrice: pub.happyHourPrice,
    happyHourDays: pub.happyHourDays,
    happyHourStart: pub.happyHourStart,
    happyHourEnd: pub.happyHourEnd,
  }, now)
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function DiscoverClient({
  initialPubs,
  dataToolsRail,
}: {
  initialPubs?: Pub[]
  dataToolsRail: ReactNode
}) {
  const hasServerPubs = Boolean(initialPubs && initialPubs.length > 0)
  const [pubs, setPubs] = useState<Pub[]>(initialPubs ?? [])
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(!hasServerPubs)
  const [clockInstant, setClockInstant] = useState(() => new Date())
  const [pintOfTheDay, setPintOfTheDay] = useState<{
    pub: { name: string; slug: string; suburb: string; price: number; effectivePrice: number; beerType: string; isHappyHourNow: boolean }
    reason: string
    runnerUp: { name: string; slug: string; suburb: string; price: number } | null
  } | null>(null)

  // ─── Data Fetching ───
  useEffect(() => {
    async function load() {
      if (hasServerPubs) {
        setCrowdReports(await getCrowdLevels())
      } else {
        const [pubData, crowdData] = await Promise.all([getPubs(), getCrowdLevels()])
        setPubs(pubData)
        setCrowdReports(crowdData)
      }
      setIsLoading(false)
    }
    load()
    // Fetch Pint of the Day
    fetch('/api/pint-of-the-day')
      .then(res => res.json())
      .then(data => { if (data.pub) setPintOfTheDay(data) })
      .catch(() => {})
  }, [hasServerPubs])

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
    const interval = setInterval(() => setClockInstant(new Date()), 60000)
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
        const status = getPubHappyHourStatus(p, clockInstant)
        return (status.isActive || status.isToday) && status.effectivePrice !== null
      })
      .map(p => ({ pub: p, status: getPubHappyHourStatus(p, clockInstant) }))
      .sort((a, b) => {
        if (a.status.isActive && !b.status.isActive) return -1
        if (!a.status.isActive && b.status.isActive) return 1
        return (a.status.effectivePrice ?? 99) - (b.status.effectivePrice ?? 99)
      })
      .slice(0, 5)
  }, [pubs, clockInstant])

  // Pub Picks counts
  const pubPickCounts = useMemo(() => ({
    sunset: pubs.filter(p => p.sunsetSpot === true).length,
    dad: pubs.filter(isDadBar).length,
    beer: verifiedPubs.length,
    cozy: pubs.filter(p => p.cozyPub === true).length,
    punt: pubs.filter(p => p.hasTab === true).length,
    happy: pubs.filter(p => p.happyHour !== null && p.happyHour !== '').length,
  }), [pubs, verifiedPubs])

  const cityStats = useMemo(() => {
    const prices = verifiedPubs.map(p => p.price!).sort((a, b) => a - b)
    const median = prices.length ? prices[Math.floor((prices.length - 1) / 2)] : null
    return { venueCount: pubs.length, median, cheapest: bestBuys[0] ?? null }
  }, [pubs, verifiedPubs, bestBuys])

  // ─── Loading State ───
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FDF8F0]">
        <h1 className="sr-only">Where to find a cheap pint in Perth</h1>
        <SubPageNav breadcrumbs={[{ label: 'Discover' }]} />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-gray border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <h1 className="sr-only">Where to find a cheap pint in Perth</h1>
      <SubPageNav breadcrumbs={[{ label: 'Discover' }]} />

      <div className="max-w-container mx-auto px-6">

        {/* ════════════════════════════════════════════
            0. ANSWER-FIRST STANDFIRST
            ════════════════════════════════════════════ */}
        <section className="pt-8 sm:pt-10 mb-10 sm:mb-14">
          <p className="font-body text-[0.95rem] leading-relaxed text-ink">
            We track the price of a pint across {cityStats.venueCount} Perth pubs and check them often enough to be worth trusting.
            {cityStats.cheapest && cityStats.median !== null && (
              <> Right now the cheapest verified pint is <span className="font-mono font-bold">${cityStats.cheapest.price!.toFixed(2)}</span> at {cityStats.cheapest.name}, in {cityStats.cheapest.suburb}. The median across the city sits at <span className="font-mono font-bold">${cityStats.median.toFixed(2)}</span>.</>
            )}
          </p>
          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mt-3">
            The practical layer the glossy bar guides skip — not the fit-out or the cocktail list, just what a pint costs, when it&apos;s cheaper, and where&apos;s cheaper nearby. Prices come from punters reporting in and from Andrew, our recorded line that rings pubs and asks. Each one carries the date we last checked.
          </p>
          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mt-3">
            Start with <Link href="#best-buys" className="text-amber font-bold hover:underline">tonight&apos;s cheapest pints</Link>, filter by <Link href="/suburbs" className="text-amber font-bold hover:underline">suburb</Link>, or see which pubs have a <Link href="/happy-hour" className="text-amber font-bold hover:underline">happy hour on now</Link>.
          </p>
        </section>

        {/* Fetch-failure fallback — without it the sections below render as
            headers over empty lists */}
        {pubs.length === 0 && (
          <section className="mb-10 sm:mb-14">
            <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-8 text-center">
              <h2 className="font-mono text-lg font-extrabold text-ink mb-2">The pub list didn&apos;t load</h2>
              <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mb-5 max-w-[420px] mx-auto">
                Could be a patchy connection, could be us. Give it another go.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all cursor-pointer"
              >
                Try again
              </button>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════
            1. HERO: Pint of the Day
            ════════════════════════════════════════════ */}
        {pintOfTheDay && (
          <section className="mb-10 sm:mb-14">
            <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white py-10 px-6 text-center">
              <p className="type-eyebrow mb-2">
                <Star className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />Pint of the Day
              </p>
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <Beer className="w-5 h-5 text-amber" />
                <Link href={pubUrl(pintOfTheDay.pub)} className="font-mono text-lg sm:text-xl font-extrabold text-ink hover:text-amber transition-colors no-underline">
                  {pintOfTheDay.pub.name}
                </Link>
                <span className="text-gray-mid text-sm">{pintOfTheDay.pub.suburb}</span>
              </div>
              <div className="type-price text-[2.5rem]">
                ${pintOfTheDay.pub.effectivePrice.toFixed(2)}
              </div>
              <p className="text-[0.75rem] text-gray-mid mt-1">{pintOfTheDay.reason}</p>
              {pintOfTheDay.pub.isHappyHourNow && (
                <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-amber text-white border-2 border-amber rounded-pill font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em]">
                  <Clock className="w-3 h-3" />Happy Hour Active
                </span>
              )}
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
                  <Link key={pub.id} href={pubUrl(pub)} className="flex items-center justify-between p-2.5 rounded-card border-l-2 border-l-transparent hover:border-l-amber hover:bg-off-white transition-all group no-underline">
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
              <Link href={DISCOVER_BEST_BUYS_HREF} className="block mt-4 font-mono text-[0.75rem] font-bold text-amber hover:underline no-underline">
                See Perth&apos;s cheapest pints →
              </Link>
            </div>

            {/* Right: Happy Hours */}
            <div className="bg-white border-3 border-ink shadow-hard-sm rounded-card p-6">
              <h3 className="font-mono text-base font-extrabold text-ink mb-1"><Clock className="w-4 h-4 inline" /> Happy Hours</h3>
              <p className="text-sm text-gray-mid mb-4">Starting soon near you</p>
              <div className="space-y-1">
                {upcomingHappyHours.length === 0 && (
                  <p className="text-sm text-gray-mid py-4 text-center">No happy hours active or upcoming right now. Check back later.</p>
                )}
                {upcomingHappyHours.map(({ pub, status }) => (
                  <Link key={pub.id} href={pubUrl(pub)} className="flex items-center justify-between p-2.5 rounded-card border-l-2 border-l-transparent hover:border-l-amber hover:bg-off-white transition-all group no-underline">
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-bold text-ink truncate block group-hover:text-amber transition-colors">{pub.name}</span>
                      <p className="text-xs text-gray-mid">{pub.suburb}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${status.isActive ? 'bg-amber text-white border border-amber' : 'bg-off-white text-gray-mid border border-gray-light'}`}>
                        {status.countdown || status.happyHourLabel}
                      </span>
                      <span className="font-mono text-lg font-extrabold text-ink tabular-nums">{status.effectivePrice !== null ? `$${status.effectivePrice.toFixed(2)}` : 'TBC'}</span>
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

        {dataToolsRail}

        {/* ════════════════════════════════════════════
            3. PUB PICKS CAROUSEL
            ════════════════════════════════════════════ */}
        <section className="mb-10 sm:mb-14">
          <h2 className="type-section">Pub Picks</h2>
          <p className="text-sm text-gray-mid mt-1 mb-6">Pub lists for every mood</p>

          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pl-1 pb-4 pr-10 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>

              {[
                { emoji: 'sunset', title: 'Sunset Sippers', desc: 'West-facing patios and rooftop bars for golden hour pints.', bg: 'bg-amber-pale', count: pubPickCounts.sunset, href: '/guides/sunset-sippers' },
                { emoji: 'users', title: 'The Dad Bar', desc: 'Playgrounds for the kids, a cold pint and the footy for you.', bg: 'bg-white', count: pubPickCounts.dad, href: '/guides/dad-bar' },
                { emoji: 'sun', title: 'Beer Weather', desc: 'Live BOM data matched to beer garden picks — so you know before you walk.', bg: 'bg-green-pale', count: pubPickCounts.beer, href: '/guides/beer-weather' },
                { emoji: 'umbrella', title: 'Cosy Corners', desc: 'Fireplaces, booths, and warmth for when it\'s bucketing down.', bg: 'bg-white', count: pubPickCounts.cozy, href: '/guides/cozy-corners' },
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
            4. ARTICLE RAIL — after the live data and picks, matching the
            homepage's prices-before-reading order
            ════════════════════════════════════════════ */}
        <div className="-mx-6 mb-10 sm:mb-14">
          <ArticleRail
            eyebrow="New"
            title="Pub notes worth a read"
            intro="The price-led explainers behind the lists: under-$10 pints, happy hours that actually drop, and why glass size does the maths."
            source="discover_article_rail"
          />
        </div>

        {/* ════════════════════════════════════════════
            5. CONTRIBUTE CTA BANNER
            ════════════════════════════════════════════ */}
        <section className="mb-10 sm:mb-14">
          <div className="bg-ink border-3 border-ink rounded-card p-6 text-center shadow-hard-sm">
            <h2 className="type-section text-white mb-2">Know a price we&apos;re missing?</h2>
            <p className="text-white/60 text-sm mb-4">Help Perth drink cheaper.</p>
            <Link
              href="/?submit=1"
              className="inline-flex font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              Report a price
            </Link>
            <p className="text-white/40 text-sm mt-4">{pubs.length} venues tracked · Updated weekly</p>
          </div>
        </section>

      </div>

      <Footer />
    </main>
  )
}
