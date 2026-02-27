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
        <SubPageNav title="Insights" subtitle="Real-time market data for Perth pints" />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  const sections = [
    { id: 'pint-of-the-day', label: 'Pint of the Day' },
    { id: 'pint-index', label: 'Market Data' },
    { id: 'suburbs', label: 'Suburbs' },
    { id: 'venues', label: 'Venues' },
  ]

  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav title="Insights" subtitle="Real-time market data for Perth pints" />
      
      {/* Section nav */}
      <div className="sticky top-[52px] z-40 bg-cream/95 backdrop-blur-sm border-b border-stone-200/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {sections.map(s => (
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div id="pint-of-the-day">
          <ErrorBoundary><PintOfTheDay /></ErrorBoundary>
        </div>

        <div id="pint-index" className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
