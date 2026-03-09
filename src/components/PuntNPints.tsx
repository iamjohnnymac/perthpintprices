'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { getHappyHourStatus } from '@/lib/happyHour'
import { Trophy, Zap, Dog, ExternalLink } from 'lucide-react'

interface TabLocation {
  id: number
  name: string
  address: string
  suburb: string
  lat: number
  lng: number
  type: string
}

interface RaceMeeting {
  venue: string
  type: 'T' | 'H' | 'G'
  raceCount: number
  firstRace: string | null
  lastRace: string | null
}

interface PuntNPintsProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

const raceTypeConfig = {
  T: { label: 'Thoroughbred', icon: Trophy, color: 'text-amber' },
  H: { label: 'Harness', icon: Zap, color: 'text-ink' },
  G: { label: 'Greyhound', icon: Dog, color: 'text-gray-mid' },
}

export default function PuntNPints({ pubs, userLocation }: PuntNPintsProps) {
  const [tabLocations, setTabLocations] = useState<TabLocation[]>([])
  const [raceMeets, setRaceMeets] = useState<RaceMeeting[]>([])
  const [raceMeetsLoading, setRaceMeetsLoading] = useState(true)
  const [showAllTab, setShowAllTab] = useState(false)
  const [showAllNearby, setShowAllNearby] = useState(false)

  // Fetch TAB locations
  useEffect(() => {
    async function fetchTabs() {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase.from('tab_locations').select('*')
        if (data) setTabLocations(data)
      } catch { /* silent */ }
    }
    fetchTabs()
  }, [])

  // Fetch race meets
  useEffect(() => {
    fetch('/api/race-meets')
      .then(res => res.json())
      .then(data => { if (data.meetings) setRaceMeets(data.meetings) })
      .catch(() => {})
      .finally(() => setRaceMeetsLoading(false))
  }, [])

  // Pubs with TAB on-site, sorted by price
  const tabPubs = useMemo(() => {
    return pubs
      .filter(p => p.hasTab && p.price !== null)
      .sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      })
  }, [pubs, userLocation])

  // For pubs without TAB, find nearest TAB agency
  const nearbyPairs = useMemo(() => {
    if (tabLocations.length === 0) return []

    const nonTabPubs = pubs
      .filter(p => !p.hasTab && p.price !== null && p.lat && p.lng)
      .sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return a.price! - b.price!
      })
      .slice(0, 20)

    return nonTabPubs.map(pub => {
      let nearest: TabLocation | null = null
      let minDist = Infinity
      for (const tab of tabLocations) {
        const d = getDistanceKm(pub.lat, pub.lng, tab.lat, tab.lng)
        if (d < minDist) {
          minDist = d
          nearest = tab
        }
      }
      return { pub, nearestTab: nearest, distance: minDist }
    }).filter(p => p.distance < 3)
      .sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.pub.lat, a.pub.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.pub.lat, b.pub.lng)
        }
        return a.pub.price! - b.pub.price!
      })
  }, [pubs, tabLocations, userLocation])

  const displayTabPubs = showAllTab ? tabPubs : tabPubs.slice(0, 10)
  const displayNearby = showAllNearby ? nearbyPairs : nearbyPairs.slice(0, 10)

  return (
    <div className="space-y-8">
      {/* ═══ Race Meets Hero ═══ */}
      <section>
        <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden">
          <div className="px-5 py-4 border-b-3 border-ink bg-ink">
            <h2 className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white">
              Today&apos;s WA Races
            </h2>
          </div>
          <div className="p-5">
            {raceMeetsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-12 bg-off-white rounded-card animate-pulse" />
                ))}
              </div>
            ) : raceMeets.length > 0 ? (
              <div className="space-y-3">
                {raceMeets.map((meet) => {
                  const config = raceTypeConfig[meet.type]
                  const Icon = config.icon
                  return (
                    <div key={`${meet.venue}-${meet.type}`} className="flex items-center justify-between py-2.5 px-3 bg-off-white rounded-card">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-mono text-[0.85rem] font-extrabold text-ink">{meet.venue}</p>
                          <p className="font-mono text-[0.65rem] text-gray-mid">
                            {config.label} · {meet.raceCount} races
                          </p>
                        </div>
                      </div>
                      {meet.firstRace && meet.lastRace && (
                        <span className="font-mono text-[0.75rem] font-bold text-ink flex-shrink-0">
                          {meet.firstRace}–{meet.lastRace}
                        </span>
                      )}
                    </div>
                  )
                })}
                <a
                  href="https://www.tabtouch.com.au/racing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[0.65rem] font-bold text-gray-mid hover:text-amber transition-colors mt-1"
                >
                  Full form on TABtouch <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="font-body text-[0.85rem] text-gray-mid">No WA races scheduled today.</p>
                <p className="font-mono text-[0.7rem] text-gray-mid mt-1">Check back tomorrow.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ TAB Pubs Section ═══ */}
      <section>
        <h2 className="font-mono font-extrabold text-xl tracking-[-0.02em] text-ink">Bet & Drink Under One Roof</h2>
        <p className="text-sm text-gray-mid mt-1 mb-5">Pubs with TAB on-site. Punt and pint, sorted by price</p>

        <div className="border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-light bg-off-white">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid">
              {tabPubs.length} venues with TAB
            </span>
          </div>

          {displayTabPubs.map((pub, i) => {
            const hhStatus = getHappyHourStatus(pub.happyHour)
            const distance = userLocation
              ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))
              : null
            return (
              <Link
                key={pub.id}
                href={`/pub/${pub.slug}`}
                className={`flex items-center justify-between px-4 py-3.5 no-underline group ${
                  i > 0 ? 'border-t border-gray-light' : ''
                } ${i === 0 ? 'bg-amber/5' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[0.65rem] font-bold w-4 flex-shrink-0 ${i === 0 ? 'text-amber' : 'text-gray-mid'}`}>
                      {i === 0 ? '\u2605' : `${i + 1}`}
                    </span>
                    <p className="font-body text-base font-bold text-ink group-hover:text-amber transition-colors truncate">
                      {pub.name}
                    </p>
                    <span className="font-mono text-[0.5rem] font-black px-1.5 py-0.5 rounded-pill border-2 border-ink bg-ink text-white flex-shrink-0">
                      TAB
                    </span>
                    {hhStatus.isActive && (
                      <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 bg-red-pale text-red border-red flex-shrink-0">
                        HH
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-6 mt-0.5">
                    <span className="font-body text-[0.78rem] text-gray-mid">
                      {pub.suburb}
                      {distance && ` · ${distance}`}
                      {pub.beerType && ` · ${pub.beerType}`}
                    </span>
                  </div>
                  {hhStatus.isActive && pub.happyHour && (
                    <span className="font-mono text-[0.7rem] text-red font-semibold mt-0.5 ml-6 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />
                      {pub.happyHour}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[1.1rem] font-extrabold text-ink ml-3 flex-shrink-0">
                  {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                </span>
              </Link>
            )
          })}

          {tabPubs.length > 10 && (
            <div className="px-4 py-3 border-t border-gray-light text-center">
              <button
                onClick={() => setShowAllTab(!showAllTab)}
                className="font-mono text-[0.75rem] font-bold text-ink hover:text-amber transition-colors"
              >
                {showAllTab ? 'Show less' : `Show all ${tabPubs.length} TAB pubs`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Nearby TAB Section ═══ */}
      {nearbyPairs.length > 0 && (
        <section>
          <h2 className="font-mono font-extrabold text-xl tracking-[-0.02em] text-ink">Cheap Pints Near a TAB</h2>
          <p className="text-sm text-gray-mid mt-1 mb-5">No TAB on-site, but a TABtouch agency within walking distance</p>

          <div className="border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-light bg-off-white">
              <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid">
                {nearbyPairs.length} pubs near a TAB
              </span>
            </div>

            {displayNearby.map(({ pub, nearestTab, distance: tabDist }, i) => {
              const hhStatus = getHappyHourStatus(pub.happyHour)
              const userDist = userLocation
                ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))
                : null
              const tabDistStr = tabDist < 0.5
                ? `${Math.round(tabDist * 1000)}m`
                : `${tabDist.toFixed(1)}km`

              return (
                <Link
                  key={pub.id}
                  href={`/pub/${pub.slug}`}
                  className={`flex items-center justify-between px-4 py-3.5 no-underline group ${
                    i > 0 ? 'border-t border-gray-light' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.65rem] font-bold text-gray-mid w-4 flex-shrink-0">{i + 1}</span>
                      <p className="font-body text-base font-bold text-ink group-hover:text-amber transition-colors truncate">
                        {pub.name}
                      </p>
                      {hhStatus.isActive && (
                        <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 bg-red-pale text-red border-red flex-shrink-0">
                          HH
                        </span>
                      )}
                    </div>
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      <span className="font-body text-[0.78rem] text-gray-mid block">
                        {pub.suburb}
                        {userDist && ` · ${userDist}`}
                        {pub.beerType && ` · ${pub.beerType}`}
                      </span>
                      {nearestTab && (
                        <span className="font-mono text-[0.65rem] text-amber font-bold block">
                          {tabDistStr} to {nearestTab.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[1.1rem] font-extrabold text-ink ml-3 flex-shrink-0">
                    {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                  </span>
                </Link>
              )
            })}

            {nearbyPairs.length > 10 && (
              <div className="px-4 py-3 border-t border-gray-light text-center">
                <button
                  onClick={() => setShowAllNearby(!showAllNearby)}
                  className="font-mono text-[0.75rem] font-bold text-ink hover:text-amber transition-colors"
                >
                  {showAllNearby ? 'Show less' : `Show all ${nearbyPairs.length} pubs`}
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
