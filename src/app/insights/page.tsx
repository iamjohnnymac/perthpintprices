'use client'
import { useState, useEffect } from 'react'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'
import SubPageNav from '@/components/SubPageNav'
import PintOfTheDay from '@/components/PintOfTheDay'
import PintIndex from '@/components/PintIndex'
import TonightsMoves from '@/components/TonightsMoves'
import SuburbLeague from '@/components/SuburbLeague'
import CrowdPulse from '@/components/CrowdPulse'
import VenueIntel from '@/components/VenueIntel'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'

const insightCards = [
  { href: '/insights/pint-of-the-day', icon: '🍺', title: 'Pint of the Day', desc: "Today's best value pick" },
  { href: '/insights/pint-index', icon: '📈', title: 'Perth Pint Index™', desc: 'Live price tracking' },
  { href: '/insights/tonights-best-bets', icon: '🌙', title: "Tonight's Best Bets", desc: 'Where to drink now' },
  { href: '/insights/suburb-rankings', icon: '🏘️', title: 'Suburb Rankings', desc: 'Cheapest areas for a pint' },
  { href: '/insights/venue-breakdown', icon: '🔍', title: 'Venue Breakdown', desc: 'Price brackets & analysis' },
]

export default function InsightsPage() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream">
        <SubPageNav breadcrumbs={[{ label: 'Insights' }]} />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[{ label: 'Insights' }]} />

      {/* Quick-nav cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {insightCards.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-2xl p-4 border border-stone-200/40 hover:shadow-md hover:border-amber/30 transition-all group text-center"
            >
              <div className="text-2xl mb-1.5">{card.icon}</div>
              <h3 className="font-semibold text-charcoal text-xs group-hover:text-amber transition-colors">{card.title}</h3>
              <p className="text-[10px] text-stone-warm mt-0.5">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Section nav */}
      <div className="sticky top-[52px] z-40 bg-cream/95 backdrop-blur-sm border-b border-stone-200/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {[
              { id: 'pint-of-the-day', label: 'Pint of the Day' },
              { id: 'pint-index', label: 'Market Data' },
              { id: 'suburbs', label: 'Suburbs' },
              { id: 'venues', label: 'Venues' },
            ].map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 text-xs font-semibold text-stone-warm hover:text-charcoal whitespace-nowrap rounded-full hover:bg-white transition-all"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        <div id="pint-of-the-day">
          <ErrorBoundary><PintOfTheDay /></ErrorBoundary>
        </div>

        <div id="pint-index" className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <ErrorBoundary><PintIndex /></ErrorBoundary>
          <ErrorBoundary><TonightsMoves pubs={pubs} userLocation={userLocation} /></ErrorBoundary>
        </div>

        <div id="suburbs">
          <ErrorBoundary><SuburbLeague pubs={pubs} /></ErrorBoundary>
        </div>

        <div id="crowd">
          <ErrorBoundary><CrowdPulse pubs={pubs} crowdReports={crowdReports} userLocation={userLocation} /></ErrorBoundary>
        </div>

        <div id="venues">
          <ErrorBoundary><VenueIntel pubs={pubs} userLocation={userLocation} /></ErrorBoundary>
        </div>
      </div>

      <Footer />
    </main>
  )
}
