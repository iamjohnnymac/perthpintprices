'use client'

import Link from 'next/link'

interface HeroSectionProps {
  avgPrice: string
  cheapestPrice: number
  cheapestSlug: string
  venueCount: number
  suburbCount: number
  happyHourCount: number
  onExploreClick: () => void
  onDiscoverClick: () => void
  onSubmitClick: () => void
}

export default function HeroSection({
  avgPrice,
  cheapestPrice,
  cheapestSlug,
  venueCount,
  suburbCount,
  happyHourCount,
  onExploreClick,
  onDiscoverClick,
  onSubmitClick,
}: HeroSectionProps) {
  return (
    <section className="bg-cream relative overflow-hidden">
      {/* Top nav bar — minimal like EatClub */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg object-contain" />
          <span className="text-xl font-bold tracking-tight font-heading text-charcoal">PintDex</span>
        </div>
        <button
          onClick={onSubmitClick}
          className="px-5 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold transition-all text-sm"
        >
          Submit a Price
        </button>
      </div>

      {/* Hero content — big, confident, breathing room */}
      <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-24 pb-20 sm:pb-28 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-charcoal font-heading leading-[1.05] mb-6">
          Perth&apos;s pint prices,{' '}
          <span className="text-amber">sorted.</span>
        </h1>
        <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Real-time prices across {venueCount}+ pubs and {suburbCount} suburbs.
          Find happy hours, compare prices, and save on your next round.
        </p>

        {/* Hero stat highlights — EatClub-style bold numbers */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10">
          {cheapestSlug ? (
            <Link href={`/pub/${cheapestSlug}`} className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-stone-200/60 hover:border-amber/50 hover:shadow-md transition-all group">
              <span className="block text-2xl sm:text-3xl font-bold font-mono text-green-700 group-hover:text-amber transition-colors">${cheapestPrice}</span>
              <span className="text-xs text-stone-500 group-hover:text-amber transition-colors">Cheapest pint →</span>
            </Link>
          ) : (
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-stone-200/60">
              <span className="block text-2xl sm:text-3xl font-bold font-mono text-green-700">${cheapestPrice}</span>
              <span className="text-xs text-stone-500">Cheapest pint</span>
            </div>
          )}
          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-stone-200/60">
            <span className="block text-2xl sm:text-3xl font-bold font-mono text-charcoal">${avgPrice}</span>
            <span className="text-xs text-stone-500">Perth average</span>
          </div>
          {happyHourCount > 0 && (
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-amber/30 bg-amber/5">
              <span className="block text-2xl sm:text-3xl font-bold font-mono text-amber">{happyHourCount}</span>
              <span className="text-xs text-stone-500">Happy hours live</span>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-charcoal/10"
          >
            Explore {venueCount} venues
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <button
            onClick={onDiscoverClick}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-stone-50 text-charcoal rounded-full font-bold text-lg transition-all border border-stone-300"
          >
            Discover features
          </button>
        </div>
      </div>
    </section>
  )
}
