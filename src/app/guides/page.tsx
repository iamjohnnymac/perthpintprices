'use client'
import { useState, useEffect } from 'react'
import { Pub } from '@/types/pub'
import { getPubs } from '@/lib/supabase'
import SubPageNav from '@/components/SubPageNav'
import BeerWeather from '@/components/BeerWeather'
import RainyDay from '@/components/RainyDay'
import SunsetSippers from '@/components/SunsetSippers'
import PuntNPints from '@/components/PuntNPints'
import DadBar from '@/components/DadBar'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'

const guideCards = [
  { id: 'beer-weather', icon: '🌤', title: 'Beer Weather', desc: 'Weather-matched picks' },
  { id: 'sunset', icon: '🌅', title: 'Sunset Sippers', desc: 'Golden hour spots' },
  { id: 'punt', icon: '🏇', title: 'Punt & Pints', desc: 'TAB-equipped pubs' },
  { id: 'dad-bar', icon: '👨', title: 'The Dad Bar', desc: 'Classic dad pubs' },
  { id: 'cozy', icon: '☔', title: 'Cozy Corners', desc: 'Rainy day refuges' },
  { id: 'pub-golf', icon: '⛳', title: 'Pub Golf', desc: 'Score your crawl', href: '/pub-golf' },
  { id: 'pint-crawl', icon: '🗺️', title: 'Pint Crawl', desc: 'Plan your route', href: '/pint-crawl' },
  { id: 'leaderboard', icon: '🏆', title: 'Leaderboard', desc: 'Top scouts', href: '/leaderboard' },
]

export default function GuidesPage() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeGuide, setActiveGuide] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const data = await getPubs()
      setPubs(data)
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
        <SubPageNav title="Guides" subtitle="Curated pub picks for every occasion" />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav title="Guides" subtitle="Curated pub picks for every occasion" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {guideCards.map(card => {
            if (card.href) {
              return (
                <Link key={card.id} href={card.href} className="bg-white rounded-2xl p-5 border border-stone-200/40 hover:shadow-md transition-all group text-center">
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <h3 className="font-semibold text-charcoal text-sm group-hover:text-amber transition-colors">{card.title}</h3>
                  <p className="text-[11px] text-stone-warm mt-1">{card.desc}</p>
                </Link>
              )
            }
            return (
              <button
                key={card.id}
                onClick={() => setActiveGuide(activeGuide === card.id ? null : card.id)}
                className={`bg-white rounded-2xl p-5 border transition-all group text-center ${
                  activeGuide === card.id ? 'border-amber/40 shadow-md' : 'border-stone-200/40 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">{card.icon}</div>
                <h3 className={`font-semibold text-sm transition-colors ${activeGuide === card.id ? 'text-amber' : 'text-charcoal group-hover:text-amber'}`}>{card.title}</h3>
                <p className="text-[11px] text-stone-warm mt-1">{card.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Active guide content */}
        <div className="space-y-6">
          {(activeGuide === 'beer-weather' || !activeGuide) && <ErrorBoundary><BeerWeather pubs={pubs} userLocation={userLocation} /></ErrorBoundary>}
          {activeGuide === 'sunset' && <ErrorBoundary><SunsetSippers pubs={pubs} userLocation={userLocation} /></ErrorBoundary>}
          {activeGuide === 'punt' && <ErrorBoundary><PuntNPints pubs={pubs} userLocation={userLocation} /></ErrorBoundary>}
          {activeGuide === 'dad-bar' && <ErrorBoundary><DadBar pubs={pubs} userLocation={userLocation} /></ErrorBoundary>}
          {activeGuide === 'cozy' && <ErrorBoundary><RainyDay pubs={pubs} userLocation={userLocation} /></ErrorBoundary>}
        </div>
      </div>

      <Footer />
    </main>
  )
}
