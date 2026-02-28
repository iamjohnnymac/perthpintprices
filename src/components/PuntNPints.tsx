'use client'

import Link from 'next/link'

import { useState, useMemo, useEffect } from 'react'
import { Pub } from '@/types/pub'
import InfoTooltip from './InfoTooltip'
import { Card, CardContent } from '@/components/ui/card'
import { getDistanceKm, formatDistance } from '@/lib/location'

interface TabLocation {
  id: number
  name: string
  address: string
  suburb: string
  lat: number
  lng: number
  type: string
}

interface PuntNPintsProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

export default function PuntNPints({ pubs, userLocation }: PuntNPintsProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [tabLocations, setTabLocations] = useState<TabLocation[]>([])

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

  // Pubs with TAB on-site — the holy grail: punt AND pint under one roof
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
    }).filter(p => p.distance < 3) // Within 3km
      .sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.pub.lat, a.pub.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.pub.lat, b.pub.lng)
        }
        return a.pub.price! - b.pub.price!
      })
  }, [pubs, tabLocations, userLocation])

  const displayedTabPubs = isExpanded ? tabPubs : tabPubs.slice(0, 10)
  const displayedPairs = isExpanded ? nearbyPairs.slice(0, 10) : nearbyPairs.slice(0, 10)

  return (
    <Card className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-stone-200/40 h-full cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.995] overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3" onClick={() => setIsSectionOpen(!isSectionOpen)}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5B2D8E, #7B3FAE)' }}>
              <span className="text-white font-black text-[9px] leading-none tracking-tight">TAB</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading text-stone-800 leading-tight">PUNT &amp; PINTS</h3>
              <p className="text-[10px] text-stone-500">Where to bet &amp; sip</p>
            </div>
            <InfoTooltip text="Shows pubs with TAB betting facilities on-site, plus cheap pints near dedicated TAB agencies. Data sourced from TABtouch WA locations." />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border" style={{ backgroundColor: '#F0E6F6', borderColor: '#D4B8E8' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5B2D8E' }} />
              <span className="text-[10px] font-medium" style={{ color: '#5B2D8E' }}>{tabPubs.length} TAB Pubs</span>
            </div>
            {!isSectionOpen && tabPubs[0]?.price && (
              <span className="text-sm font-bold" style={{ color: '#F58220' }}>from ${tabPubs[0].price.toFixed(2)}</span>
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isSectionOpen ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {isSectionOpen && (<>
        {/* TAB Pubs — Cheapest pints where you can bet on-site */}
        <div className="mb-3">
          <p className="text-[10px] font-medium text-stone-500 mb-1.5">
            Bet &amp; Drink Under One Roof
          </p>
          <div className="space-y-1">
            {displayedTabPubs.map(pub => (
              <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-stone-100 hover:border-purple-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black px-1 py-px rounded flex-shrink-0 text-white" style={{ backgroundColor: '#5B2D8E' }}>TAB</span>
                    <span className="text-xs font-semibold text-stone-800 truncate">{pub.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</span>
                    <span className="text-[9px] px-1 py-px rounded bg-stone-100 text-stone-500">{pub.beerType || 'Tap Beer'}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-bold" style={{ color: '#F58220' }}>${pub.price?.toFixed(2)}</span>
                  <div className="text-[9px] text-stone-400">per pint</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Nearby TAB + Cheap Pint combos */}
        {nearbyPairs.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-medium text-stone-500 mb-1.5">
              Cheap Pints Near a TAB
            </p>
            <div className="space-y-1">
              {displayedPairs.map(({ pub, nearestTab, distance }) => (
                <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center justify-between p-2 rounded-xl bg-white/40 border border-stone-100">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</span>
                      {nearestTab && (
                        <span className="text-[9px]" style={{ color: '#5B2D8E' }}>
                          {distance < 0.5 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} to {nearestTab.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-stone-700 ml-2">${pub.price?.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Expand/collapse */}
        {(tabPubs.length > 5 || nearbyPairs.length > 3) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors"
            style={{ color: '#5B2D8E' }}
          >
            <span>{isExpanded ? 'Show less' : `Show all ${tabPubs.length} TAB pubs`}</span>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </>)}
      </CardContent>
    </Card>
  )
}
