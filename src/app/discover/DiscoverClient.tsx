'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Data components (rendered inline)
import PintIndex from '@/components/PintIndex'
import SuburbLeague from '@/components/SuburbLeague'
import VenueIntel from '@/components/VenueIntel'
import TonightsMoves from '@/components/TonightsMoves'

export default function DiscoverClient() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
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

        {/* ═══ ZONE 1: RIGHT NOW ═══ */}
        <section className="pt-10 sm:pt-14 pb-8 sm:pb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-1">Right Now</h2>
          <p className="text-sm text-stone-400 mb-6">Live deals, active happy hours, and tonight's best value.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <ErrorBoundary><PintIndex /></ErrorBoundary>
            <ErrorBoundary><TonightsMoves pubs={pubs} userLocation={userLocation} /></ErrorBoundary>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-stone-200/60" />

        {/* ═══ ZONE 2: THE NUMBERS ═══ */}
        <section className="py-8 sm:py-10">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-1">The Numbers</h2>
          <p className="text-sm text-stone-400 mb-6">How Perth's pint market stacks up — by suburb, by venue, by price bracket.</p>
          <div className="space-y-6">
            <ErrorBoundary><SuburbLeague pubs={pubs} /></ErrorBoundary>
            <ErrorBoundary><VenueIntel pubs={pubs} userLocation={userLocation} /></ErrorBoundary>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-stone-200/60" />

        {/* ═══ ZONE 3: PUB PICKS ═══ */}
        <section className="py-8 sm:py-10 pb-12 sm:pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal mb-1">Pub Picks</h2>
          <p className="text-sm text-stone-400 mb-6">Curated lists for every mood, every season, every excuse to go out.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Sunset Sippers */}
            <Link href="/guides/sunset-sippers" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 hover:shadow-lg hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">🌅</span>
                  <h3 className="text-lg font-bold text-charcoal mt-2 group-hover:text-amber transition-colors">Sunset Sippers</h3>
                  <p className="text-sm text-charcoal/60 mt-1">West-facing patios and rooftop bars for golden hour pints.</p>
                </div>
                <svg className="w-5 h-5 text-amber/40 group-hover:text-amber mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* The Dad Bar */}
            <Link href="/guides/dad-bar" className="group relative overflow-hidden rounded-2xl p-6 bg-stone-50 border border-stone-200/60 hover:shadow-lg hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">👨</span>
                  <h3 className="text-lg font-bold text-charcoal mt-2 group-hover:text-amber transition-colors">The Dad Bar</h3>
                  <p className="text-sm text-charcoal/60 mt-1">No fairy lights, no craft beer menu. Just honest pints and the footy on.</p>
                </div>
                <svg className="w-5 h-5 text-stone-300 group-hover:text-amber mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Beer Weather */}
            <Link href="/guides/beer-weather" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 border border-sky-200/50 hover:shadow-lg hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">🌤</span>
                  <h3 className="text-lg font-bold text-charcoal mt-2 group-hover:text-amber transition-colors">Beer Weather</h3>
                  <p className="text-sm text-charcoal/60 mt-1">Live BOM data matched to beer garden picks. Is it a beer garden arvo?</p>
                </div>
                <svg className="w-5 h-5 text-sky-300 group-hover:text-amber mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Cozy Corners */}
            <Link href="/guides/cozy-corners" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-200/50 hover:shadow-lg hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">☔</span>
                  <h3 className="text-lg font-bold text-charcoal mt-2 group-hover:text-amber transition-colors">Cozy Corners</h3>
                  <p className="text-sm text-charcoal/60 mt-1">Fireplaces, booths, and warmth for when it's bucketing down.</p>
                </div>
                <svg className="w-5 h-5 text-violet-300 group-hover:text-amber mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Punt & Pints */}
            <Link href="/guides/punt-and-pints" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 hover:shadow-lg hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">🏇</span>
                  <h3 className="text-lg font-bold text-charcoal mt-2 group-hover:text-amber transition-colors">Punt & Pints</h3>
                  <p className="text-sm text-charcoal/60 mt-1">TAB screens, cold pints, and a flutter on the trots.</p>
                </div>
                <svg className="w-5 h-5 text-emerald-300 group-hover:text-amber mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Happy Hours */}
            <Link href="/happy-hour" className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200/50 hover:shadow-lg hover:scale-[1.01] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">⏰</span>
                  <h3 className="text-lg font-bold text-charcoal mt-2 group-hover:text-amber transition-colors">Happy Hours</h3>
                  <p className="text-sm text-charcoal/60 mt-1">Live deals happening right now across Perth.</p>
                </div>
                <svg className="w-5 h-5 text-yellow-400 group-hover:text-amber mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
