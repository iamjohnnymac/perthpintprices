'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { SuburbInfo } from '@/lib/supabase'
import { getFreshness, formatVerifiedDate } from '@/lib/freshness'

interface SuburbClientProps {
  suburb: SuburbInfo
  pubs: Pub[]
  nearbySuburbs: SuburbInfo[]
  perthAvgPrice: number
}

export default function SuburbClient({ suburb, pubs, nearbySuburbs, perthAvgPrice }: SuburbClientProps) {
  const [showAll, setShowAll] = useState(false)
  const displayPubs = showAll ? pubs : pubs.slice(0, 10)

  const avgNum = Number(suburb.avgPrice)
  const priceDiff = avgNum > 0 ? ((avgNum - perthAvgPrice) / perthAvgPrice * 100) : 0
  const isCheaper = priceDiff < 0
  const diffText = avgNum > 0
    ? `${Math.abs(Math.round(priceDiff))}% ${isCheaper ? 'cheaper' : 'more expensive'} than Perth average`
    : null

  // Price distribution
  const priced = pubs.filter(p => p.price !== null)
  const under8 = priced.filter(p => p.price! <= 8).length
  const mid = priced.filter(p => p.price! > 8 && p.price! <= 11).length
  const over11 = priced.filter(p => p.price! > 11).length

  return (
    <main className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-[1000] border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="#E8820C" strokeWidth="2.5" strokeLinecap="round"/></svg>
              <span className="font-serif text-xl text-charcoal">arvo</span>
            </Link>
            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/discover" className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-charcoal bg-cream-dark hover:bg-amber/10 hover:text-amber rounded-full transition-all">
                Discover
              </Link>
              <Link href="/happy-hour" className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-charcoal bg-cream-dark hover:bg-amber/10 hover:text-amber rounded-full transition-all">
                Happy Hours
              </Link>
            </nav>
            <Link
              href="/"
              className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-semibold transition-all text-xs"
            >
              <span className="hidden sm:inline">Submit a Price</span>
              <span className="sm:hidden">Submit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-stone-400">
          <Link href="/" className="hover:text-amber transition-colors">Home</Link>
          <span>›</span>
          <span className="text-stone-600 font-medium">{suburb.name}</span>
        </nav>
      </div>

      {/* Hero Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mb-2">
          Pint Prices in {suburb.name}
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          {suburb.pubCount} {suburb.pubCount === 1 ? 'venue' : 'venues'} tracked
          {suburb.happyHourCount > 0 && ` · ${suburb.happyHourCount} with happy hours`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-stone-200/40 shadow-sm">
            <p className="text-xs text-stone-400 mb-1">Cheapest Pint</p>
            <p className="text-2xl font-bold text-charcoal">
              {suburb.cheapestPrice !== 'TBC' ? `$${suburb.cheapestPrice}` : 'TBC'}
            </p>
            {suburb.cheapestPub && (
              <Link href={`/pub/${suburb.cheapestPubSlug}`} className="text-xs text-amber hover:underline mt-1 block truncate">
                {suburb.cheapestPub}
              </Link>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-stone-200/40 shadow-sm">
            <p className="text-xs text-stone-400 mb-1">Average Price</p>
            <p className="text-2xl font-bold text-charcoal">
              {avgNum > 0 ? `$${suburb.avgPrice}` : 'TBC'}
            </p>
            {diffText && (
              <p className={`text-xs mt-1 ${isCheaper ? 'text-charcoal' : 'text-red-500'}`}>
                {isCheaper ? '↓' : '↑'} {diffText}
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl p-4 border border-stone-200/40 shadow-sm">
            <p className="text-xs text-stone-400 mb-1">Most Expensive</p>
            <p className="text-2xl font-bold text-charcoal">
              {suburb.mostExpensivePrice !== 'TBC' ? `$${suburb.mostExpensivePrice}` : 'TBC'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-stone-200/40 shadow-sm">
            <p className="text-xs text-stone-400 mb-1">Happy Hours</p>
            <p className="text-2xl font-bold text-charcoal">{suburb.happyHourCount}</p>
            <p className="text-xs text-stone-400 mt-1">
              of {suburb.pubCount} venues
            </p>
          </div>
        </div>
      </section>

      {/* Pub Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">All Venues — Cheapest First</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-xs">
                  <th className="px-4 py-2.5 text-left font-medium w-10">#</th>
                  <th className="px-4 py-2.5 text-left font-medium">Venue</th>
                  <th className="px-4 py-2.5 text-center font-medium">Pint Price</th>
                  <th className="px-4 py-2.5 text-center font-medium hidden sm:table-cell">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Happy Hour</th>
                </tr>
              </thead>
              <tbody>
                {displayPubs.map((pub, i) => {
                  const freshness = getFreshness(pub.lastVerified)
                  return (
                    <tr key={pub.id} className={`border-t border-stone-100 hover:bg-stone-50/50 transition-colors ${i === 0 ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3 text-stone-400 text-xs font-medium">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/pub/${pub.slug}`} className="font-semibold text-charcoal hover:text-amber transition-colors">
                          {pub.name}
                        </Link>
                        <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[200px] sm:max-w-none">{pub.address}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pub.price !== null && pub.priceVerified ? (
                          <span className="font-bold text-charcoal text-base">
                            ${pub.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs font-medium">TBC</span>
                        )}
                        {pub.beerType && (
                          <p className="text-[10px] text-stone-400 mt-0.5">{pub.beerType}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${freshness.bgColor} ${freshness.color} border ${freshness.borderColor}`}>
                          {freshness.icon} {freshness.label}
                        </span>
                        <p className="text-[10px] text-stone-400 mt-0.5">{formatVerifiedDate(pub.lastVerified)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {pub.happyHour ? (
                          <span className="text-xs text-amber font-medium">{pub.happyHour}</span>
                        ) : (
                          <span className="text-xs text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {pubs.length > 10 && (
            <div className="px-4 py-3 border-t border-stone-100 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm font-semibold text-charcoal hover:text-amber transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${pubs.length} venues`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Price Insights */}
      {priced.length >= 3 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/40 p-4 sm:p-6">
            <h2 className="font-semibold text-stone-800 mb-3">Price Distribution</h2>
            <div className="flex items-end gap-2 h-20 mb-3">
              {[
                { label: 'Under $8', count: under8, color: 'bg-amber-400' },
                { label: '$8–$11', count: mid, color: 'bg-amber' },
                { label: 'Over $11', count: over11, color: 'bg-red-400' },
              ].map(band => {
                const pct = priced.length > 0 ? (band.count / priced.length) * 100 : 0
                return (
                  <div key={band.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-stone-700">{band.count}</span>
                    <div className="w-full rounded-t-lg relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                      <div className={`absolute inset-0 ${band.color} rounded-t-lg`} />
                    </div>
                    <span className="text-[10px] text-stone-400">{band.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-stone-400">
              Based on {priced.length} venues with verified prices in {suburb.name}.
              {avgNum > 0 && ` The Perth-wide average is $${perthAvgPrice.toFixed(2)}.`}
            </p>
          </div>
        </section>
      )}

      {/* Nearby Suburbs */}
      {nearbySuburbs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
          <h2 className="font-semibold text-stone-800 mb-3">Nearby Suburbs</h2>
          <div className="flex flex-wrap gap-2">
            {nearbySuburbs.map(ns => (
              <Link
                key={ns.slug}
                href={`/suburb/${ns.slug}`}
                className="px-4 py-2 bg-white rounded-xl border border-stone-200/40 shadow-sm hover:border-amber/40 hover:shadow-md transition-all group"
              >
                <span className="font-semibold text-charcoal group-hover:text-amber transition-colors text-sm">{ns.name}</span>
                <span className="text-xs text-stone-400 ml-2">
                  {ns.pubCount} {ns.pubCount === 1 ? 'pub' : 'pubs'}
                  {ns.cheapestPrice !== 'TBC' && ` · from $${ns.cheapestPrice}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-charcoal rounded-2xl p-6 text-center">
          <h2 className="font-serif text-xl text-white mb-2">Know a price in {suburb.name}?</h2>
          <p className="text-stone-300 text-sm mb-4">Help us keep {suburb.name} pint prices accurate.</p>
          <Link
            href="/?submit=1"
            className="inline-flex px-6 py-2.5 bg-amber hover:bg-amber/90 text-white rounded-full font-semibold text-sm transition-all"
          >
            Submit a Price
          </Link>
        </div>
      </section>
    </main>
  )
}
