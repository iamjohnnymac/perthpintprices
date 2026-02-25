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
    <section className="relative overflow-hidden">
      {/* Top nav bar */}
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-amber text-2xl">✳</span>
          <span className="font-serif text-2xl text-charcoal">arvo</span>
        </div>
        <button
          onClick={onSubmitClick}
          className="px-5 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-full text-sm font-semibold transition-all"
        >
          Submit a Price
        </button>
      </nav>

      {/* Hero content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 text-center">
        <h1 className="font-serif text-[2.5rem] sm:text-[3.5rem] lg:text-[4.25rem] text-charcoal leading-[1.08] mb-2">
          Perth&apos;s pint prices,{' '}
          <span className="text-amber">sorted.</span>
        </h1>
        <p className="text-base sm:text-lg text-stone-warm max-w-lg mx-auto mb-3 leading-relaxed">
          Discover {venueCount}+ venues across {suburbCount} suburbs.
          Real prices from real people.
        </p>

        {/* Search bar — EatClub-style clean input */}
        <div ref={searchRef} className="relative max-w-md mx-auto mb-3">
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
                className="w-full pl-12 pr-4 py-4 bg-white rounded-full text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber/30 text-base shadow-sm border border-stone-200/60"
              />
            </div>
          </form>
          
          {/* Search results dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-stone-200/40 overflow-hidden z-50">
              {results.map(pub => (
                <Link
                  key={pub.slug}
                  href={`/pub/${pub.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-cream transition-colors border-b border-stone-100 last:border-0"
                >
                  <div className="text-left">
                    <p className="font-semibold text-charcoal text-sm">{pub.name}</p>
                    <p className="text-stone-warm text-xs">{pub.suburb}{pub.beerType ? ` · ${pub.beerType}` : ''}</p>
                  </div>
                  <span className="font-mono font-bold text-charcoal text-sm">
                    {pub.effectivePrice ? `$${pub.effectivePrice.toFixed(2)}` : 'TBC'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={onExploreClick}
            className="px-7 py-3.5 bg-amber hover:bg-amber-dark text-white rounded-full font-semibold text-base transition-all inline-flex items-center gap-2"
          >
            Explore pubs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </button>
          <button
            onClick={onDiscoverClick}
            className="px-7 py-3.5 border border-stone-300 hover:border-charcoal text-charcoal rounded-full font-semibold text-base transition-all"
          >
            Discover guides
          </button>
        </div>

        {/* Happy Hour Countdown Carousel */}
        <HappyHourPreview pubs={pubs} />


      </div>
    </section>
  )
}
