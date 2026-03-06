'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pub } from '@/types/pub'
import { SuburbInfo } from '@/lib/supabase'
import { getFreshness, formatVerifiedDate } from '@/lib/freshness'
import Footer from '@/components/Footer'

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

  const priced = pubs.filter(p => p.price !== null)
  const under8 = priced.filter(p => p.price! <= 8).length
  const mid = priced.filter(p => p.price! > 8 && p.price! <= 11).length
  const over11 = priced.filter(p => p.price! > 11).length

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="max-w-container mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center text-sm shadow-[2px_2px_0_#171717]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <span className="font-mono text-[1.6rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
        </Link>
        <Link
          href="/"
          className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline"
        >
          Submit a Price
        </Link>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-container mx-auto px-6">
        <nav className="flex items-center gap-1.5 font-mono text-[0.7rem] text-gray-mid">
          <Link href="/" className="hover:text-amber transition-colors no-underline">Home</Link>
          <span>/</span>
          <span className="text-ink font-bold">{suburb.name}</span>
        </nav>
      </div>

      {/* Hero Stats */}
      <section className="max-w-container mx-auto px-6 pt-6 pb-6">
        <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1] mb-2">
          Pints in {suburb.name}
        </h1>
        <p className="text-gray-mid text-[0.85rem] mb-6">
          {suburb.pubCount} {suburb.pubCount === 1 ? 'venue' : 'venues'} tracked
          {suburb.happyHourCount > 0 && ` · ${suburb.happyHourCount} with happy hours`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cheapest', value: suburb.cheapestPrice !== 'TBC' ? `$${suburb.cheapestPrice}` : 'TBC', accent: true, link: suburb.cheapestPubSlug ? `/pub/${suburb.cheapestPubSlug}` : null, linkLabel: suburb.cheapestPub },
            { label: 'Average', value: avgNum > 0 ? `$${suburb.avgPrice}` : 'TBC', accent: false, extra: diffText },
            { label: 'Most Expensive', value: suburb.mostExpensivePrice !== 'TBC' ? `$${suburb.mostExpensivePrice}` : 'TBC', accent: false },
            { label: 'Happy Hours', value: String(suburb.happyHourCount), accent: false, extra: `of ${suburb.pubCount} venues` },
          ].map((stat) => (
            <div key={stat.label} className={`border-3 border-ink rounded-card px-4 py-4 shadow-hard-sm ${stat.accent ? 'bg-amber' : 'bg-white'}`}>
              <p className={`font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] ${stat.accent ? 'text-white/75' : 'text-gray-mid'} mb-1`}>{stat.label}</p>
              <p className={`font-mono text-[1.5rem] font-extrabold leading-none ${stat.accent ? 'text-white' : 'text-ink'}`}>
                {stat.value}
              </p>
              {stat.link && stat.linkLabel && (
                <Link href={stat.link} className={`text-[0.65rem] mt-1 block truncate no-underline ${stat.accent ? 'text-white/80 hover:text-white' : 'text-amber hover:underline'}`}>
                  {stat.linkLabel}
                </Link>
              )}
              {stat.extra && !stat.link && (
                <p className={`text-[0.65rem] mt-1 ${isCheaper && stat.label === 'Average' ? 'text-green' : 'text-gray-mid'}`}>
                  {stat.label === 'Average' && isCheaper ? '↓ ' : stat.label === 'Average' && !isCheaper ? '↑ ' : ''}{stat.extra}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pub Table */}
      <section className="max-w-container mx-auto px-6 pb-6">
        <div className="border-3 border-ink rounded-card shadow-hard overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-light">
            <h2 className="font-mono font-extrabold text-[0.85rem] text-ink uppercase tracking-[0.05em]">All Venues — Cheapest First</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-off-white text-gray-mid font-mono text-[0.65rem] uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left font-bold w-10">#</th>
                  <th className="px-4 py-2.5 text-left font-bold">Venue</th>
                  <th className="px-4 py-2.5 text-center font-bold">Pint Price</th>
                  <th className="px-4 py-2.5 text-center font-bold hidden sm:table-cell">Status</th>
                  <th className="px-4 py-2.5 text-left font-bold hidden md:table-cell">Happy Hour</th>
                </tr>
              </thead>
              <tbody>
                {displayPubs.map((pub, i) => {
                  const freshness = getFreshness(pub.lastVerified)
                  return (
                    <tr key={pub.id} className={`border-t border-gray-light hover:bg-off-white transition-colors ${i === 0 ? 'bg-amber/5' : ''}`}>
                      <td className="px-4 py-3 font-mono text-[0.7rem] font-bold text-gray-mid">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/pub/${pub.slug}`} className="font-mono text-[0.8rem] font-extrabold text-ink hover:text-amber transition-colors no-underline">
                          {pub.name}
                        </Link>
                        <p className="text-[0.7rem] text-gray-mid mt-0.5 truncate max-w-[200px] sm:max-w-none">{pub.address}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pub.price !== null && pub.priceVerified ? (
                          <span className="font-mono font-extrabold text-ink text-base">
                            ${pub.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="font-mono text-[0.7rem] font-bold text-gray-mid">TBC</span>
                        )}
                        {pub.beerType && (
                          <p className="text-[0.6rem] text-gray-mid mt-0.5">{pub.beerType}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${freshness.bgColor} ${freshness.color} border ${freshness.borderColor}`}>
                          {freshness.icon} {freshness.label}
                        </span>
                        <p className="text-[0.6rem] text-gray-mid mt-0.5">{formatVerifiedDate(pub.lastVerified)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {pub.happyHour ? (
                          <span className="text-[0.7rem] text-red font-bold">{pub.happyHour}</span>
                        ) : (
                          <span className="text-[0.7rem] text-gray-mid">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {pubs.length > 10 && (
            <div className="px-4 py-3 border-t border-gray-light text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="font-mono text-[0.75rem] font-bold text-ink hover:text-amber transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${pubs.length} venues`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Price Distribution */}
      {priced.length >= 3 && (
        <section className="max-w-container mx-auto px-6 pb-6">
          <div className="border-3 border-ink rounded-card p-5 shadow-hard-sm">
            <h2 className="font-mono font-extrabold text-[0.85rem] text-ink uppercase tracking-[0.05em] mb-3">Price Distribution</h2>
            <div className="flex items-end gap-2 h-20 mb-3">
              {[
                { label: 'Under $8', count: under8, color: 'bg-amber' },
                { label: '$8-$11', count: mid, color: 'bg-amber/60' },
                { label: 'Over $11', count: over11, color: 'bg-red' },
              ].map(band => {
                const pct = priced.length > 0 ? (band.count / priced.length) * 100 : 0
                return (
                  <div key={band.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="font-mono text-[0.7rem] font-bold text-ink">{band.count}</span>
                    <div className="w-full rounded-t-lg relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                      <div className={`absolute inset-0 ${band.color} rounded-t-lg`} />
                    </div>
                    <span className="text-[0.6rem] text-gray-mid">{band.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[0.7rem] text-gray-mid">
              Based on {priced.length} venues with verified prices in {suburb.name}.
              {avgNum > 0 && ` Perth average: $${perthAvgPrice.toFixed(2)}.`}
            </p>
          </div>
        </section>
      )}

      {/* Nearby Suburbs */}
      {nearbySuburbs.length > 0 && (
        <section className="max-w-container mx-auto px-6 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-amber" />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Nearby</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {nearbySuburbs.map(ns => (
              <Link
                key={ns.slug}
                href={`/suburb/${ns.slug}`}
                className="border-3 border-ink rounded-pill px-4 py-2 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline group"
              >
                <span className="font-mono text-[0.75rem] font-bold text-ink group-hover:text-amber transition-colors">{ns.name}</span>
                <span className="text-[0.65rem] text-gray-mid ml-2">
                  {ns.pubCount} {ns.pubCount === 1 ? 'pub' : 'pubs'}
                  {ns.cheapestPrice !== 'TBC' && ` · from $${ns.cheapestPrice}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="max-w-container mx-auto px-6 pb-8">
        <div className="bg-ink border-3 border-ink rounded-card p-6 text-center shadow-hard">
          <h2 className="font-mono font-extrabold text-xl text-white mb-2">Know a price in {suburb.name}?</h2>
          <p className="text-white/60 text-sm mb-4">Help us keep {suburb.name} pint prices accurate.</p>
          <Link
            href="/?submit=1"
            className="inline-flex font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
          >
            Submit a Price
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
