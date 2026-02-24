'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import HappyHourPreview from './HappyHourPreview'

interface HeroSectionProps {
  avgPrice: string
  cheapestPrice: number
  cheapestSlug: string
  venueCount: number
  suburbCount: number
  happyHourCount: number
  pubs: Pub[]
  onExploreClick: () => void
  onDiscoverClick: () => void
  onSubmitClick: () => void
  onSearch: (term: string) => void
}

export default function HeroSection({
  avgPrice,
  cheapestPrice,
  cheapestSlug,
  venueCount,
  suburbCount,
  happyHourCount,
  pubs,
  onExploreClick,
  onDiscoverClick,
  onSubmitClick,
  onSearch,
}: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pub[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const q = query.toLowerCase()
    const matches = pubs
      .filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.suburb.toLowerCase().includes(q) ||
        (p.beerType && p.beerType.toLowerCase().includes(q))
      )
      .slice(0, 6)
    setResults(matches)
  }, [query, pubs])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowResults(false)
    }
  }

  return (
    <section className="bg-cream relative overflow-hidden">
      {/* Top nav bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center"><span className="text-white text-lg">☀</span></div>
          <span className="text-xl font-bold tracking-tight font-heading text-charcoal">arvo</span>
        </div>
        <button
          onClick={onSubmitClick}
          className="px-5 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all text-sm"
        >
          Submit a Price
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-charcoal font-heading leading-[1.05] mb-4">
          Perth&apos;s pint prices,{' '}
          <span className="text-amber">sorted.</span>
        </h1>
        <p className="text-base sm:text-lg text-stone-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          {venueCount}+ venues. {suburbCount} suburbs. Real prices from real people.{' '}
          <br className="hidden sm:block" />
          Find your next cheap pint in 10 seconds.
        </p>

        {/* Search bar */}
        <div ref={searchRef} className="relative max-w-xl mx-auto mb-8">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search pubs, suburbs, or beers..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
                onFocus={() => setShowResults(true)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl text-charcoal placeholder-stone-400 focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 text-base shadow-sm"
              />
            </div>
          </form>
          
          {/* Search results dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden z-50">
              {results.map(pub => (
                <Link
                  key={pub.slug}
                  href={`/pub/${pub.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-cream transition-colors border-b border-stone-100 last:border-0"
                >
                  <div className="text-left">
                    <p className="font-bold text-charcoal text-sm">{pub.name}</p>
                    <p className="text-stone-400 text-xs">{pub.suburb}{pub.beerType ? ` · ${pub.beerType}` : ''}</p>
                  </div>
                  <span className="font-mono font-bold text-charcoal text-sm">
                    {pub.effectivePrice ? `$${pub.effectivePrice.toFixed(2)}` : 'TBC'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Happy Hour Countdown Carousel */}
        <HappyHourPreview pubs={pubs} />
      </div>
    </section>
  )
}
