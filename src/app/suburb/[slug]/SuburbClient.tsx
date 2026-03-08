'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, HelpCircle } from 'lucide-react'
import { Pub } from '@/types/pub'
import { SuburbInfo } from '@/lib/supabase'
import { getFreshness, formatVerifiedDate, FreshnessLevel } from '@/lib/freshness'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'

interface SuburbClientProps {
  suburb: SuburbInfo
  pubs: Pub[]
  nearbySuburbs: SuburbInfo[]
  perthAvgPrice: number
}

const freshnessIcons: Record<FreshnessLevel, React.ReactNode> = {
  verified: <CheckCircle2 className="w-3 h-3" />,
  unknown: <HelpCircle className="w-3 h-3" />,
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

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav
        breadcrumbs={[
          { label: 'Suburbs', href: '/suburbs' },
          { label: suburb.name },
        ]}
      />

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

      {/* Pub Table (desktop) + Card List (mobile) */}
      <section className="max-w-container mx-auto px-6 pb-6">
        <div className="border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-light">
            <h2 className="font-mono font-extrabold text-[0.85rem] text-ink uppercase tracking-[0.05em]">All Venues - Cheapest First</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-off-white text-gray-mid font-mono text-[0.65rem] uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left font-bold w-10">#</th>
                  <th className="px-4 py-2.5 text-left font-bold">Venue</th>
                  <th className="px-4 py-2.5 text-center font-bold">Pint Price</th>
                  <th className="px-4 py-2.5 text-center font-bold">Status</th>
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
                        <p className="text-[0.7rem] text-gray-mid mt-0.5 truncate max-w-none">{pub.address}</p>
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
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${freshness.bgColor} ${freshness.color} border ${freshness.borderColor}`}>
                          {freshnessIcons[freshness.level]} {freshness.label}
                        </span>
                        <p className="text-[0.6rem] text-gray-mid mt-0.5">{formatVerifiedDate(pub.lastVerified)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {pub.happyHour ? (
                          <span className="text-[0.7rem] text-red font-bold">{pub.happyHour}</span>
                        ) : (
                          <span className="text-[0.7rem] text-gray-mid">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden">
            {displayPubs.map((pub, i) => (
              <Link
                key={pub.id}
                href={`/pub/${pub.slug}`}
                className={`flex items-center justify-between px-4 py-3.5 no-underline group ${
                  i > 0 ? 'border-t border-gray-light' : ''
                } ${i === 0 ? 'bg-amber/5' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.65rem] font-bold text-gray-mid w-4 flex-shrink-0">{i + 1}</span>
                    <p className="font-mono text-[0.82rem] font-extrabold text-ink group-hover:text-amber transition-colors truncate">{pub.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-6 mt-0.5">
                    {pub.happyHour && (
                      <span className="text-[0.65rem] font-bold text-red">{pub.happyHour}</span>
                    )}
                    {pub.beerType && !pub.happyHour && (
                      <span className="text-[0.65rem] text-gray-mid">{pub.beerType}</span>
                    )}
                  </div>
                </div>
                <span className={`font-mono text-[1rem] font-extrabold ml-3 flex-shrink-0 ${
                  pub.price !== null && pub.priceVerified ? 'text-ink' : 'text-gray-mid text-[0.8rem]'
                }`}>
                  {pub.price !== null && pub.priceVerified ? `$${pub.price.toFixed(2)}` : 'TBC'}
                </span>
              </Link>
            ))}
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

      {/* Nearby Suburbs */}
      {nearbySuburbs.length > 0 && (
        <section className="max-w-container mx-auto px-6 pb-6">
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
        <div className="bg-ink border-3 border-ink rounded-card p-6 text-center shadow-hard-sm">
          <h2 className="font-mono font-extrabold text-xl text-white mb-2">Know a price in {suburb.name}?</h2>
          <p className="text-white/60 text-sm mb-4">Help us keep {suburb.name} pint prices accurate.</p>
          <Link
            href="/?submit=1"
            className="inline-flex font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
          >
            Submit a Price
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
