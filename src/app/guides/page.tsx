'use client'
import { useState, useEffect } from 'react'
import { Pub } from '@/types/pub'
import { getPubs } from '@/lib/supabase'
import SubPageNav from '@/components/SubPageNav'
import BeerWeather from '@/components/BeerWeather'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Link from 'next/link'

const guideCards = [
  { href: '/guides/beer-weather', icon: '🌤', title: 'Beer Weather', desc: 'Weather-matched pub picks' },
  { href: '/guides/sunset-sippers', icon: '🌅', title: 'Sunset Sippers', desc: 'Golden hour spots' },
  { href: '/guides/punt-and-pints', icon: '🏇', title: 'Punt & Pints', desc: 'TAB-equipped pubs' },
  { href: '/guides/dad-bar', icon: '👨', title: 'The Dad Bar', desc: 'Classic dad pubs' },
  { href: '/guides/cozy-corners', icon: '☔', title: 'Cozy Corners', desc: 'Rainy day refuges' },
  { href: '/happy-hour', icon: '⏰', title: 'Happy Hour', desc: 'Live deals right now' },
  { href: '/pub-golf', icon: '⛳', title: 'Pub Golf', desc: 'Score your crawl' },
  { href: '/pint-crawl', icon: '🗺️', title: 'Pint Crawl', desc: 'Plan your route' },
  { href: '/leaderboard', icon: '🏆', title: 'Leaderboard', desc: 'Top scouts' },
]

export default function GuidesPage() {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        <SubPageNav breadcrumbs={[{ label: 'Guides' }]} />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[{ label: 'Guides' }]} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Card grid — all link to dedicated pages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {guideCards.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-2xl p-5 border border-stone-200/40 hover:shadow-md hover:border-amber/30 transition-all group text-center"
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="font-semibold text-charcoal text-sm group-hover:text-amber transition-colors">{card.title}</h3>
              <p className="text-[11px] text-stone-warm mt-1">{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* Featured: Beer Weather (always shown as the hero guide) */}
        <div className="space-y-6">
          <ErrorBoundary><BeerWeather pubs={pubs} userLocation={userLocation} /></ErrorBoundary>
        </div>
      </div>

      <Footer />
    </main>
  )
}
