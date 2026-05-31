'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { SuburbInfo } from '@/lib/supabase'

interface SuburbsClientProps {
  suburbs: SuburbInfo[]
}

export default function SuburbsClient({ suburbs }: SuburbsClientProps) {
  const [search, setSearch] = useState('')

  const filtered = suburbs
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Group by first letter
  const grouped = filtered.reduce<Record<string, SuburbInfo[]>>((acc, s) => {
    const letter = s.name[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(s)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  const venueCount = suburbs.reduce((sum, s) => sum + s.pubCount, 0)
  const withAvg = [...suburbs]
    .filter(s => parseFloat(s.avgPrice) > 0)
    .sort((a, b) => parseFloat(a.avgPrice) - parseFloat(b.avgPrice))
  const cheapestSuburb = withAvg[0] ?? null
  const dearestSuburb = withAvg.length ? withAvg[withAvg.length - 1] : null

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Suburbs" subtitle={`${suburbs.length} suburbs`} />

      <div className="max-w-container mx-auto px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1] mb-2">
            Pint prices by Perth suburb
          </h1>
          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid">
            Every Perth suburb we cover, with the cheapest pint, the average, and how many pubs — <span className="text-ink font-bold">{suburbs.length}</span> suburbs, <span className="text-ink font-bold">{venueCount}</span> pubs, each price showing when we last checked.
            {cheapestSuburb && dearestSuburb && cheapestSuburb.slug !== dearestSuburb.slug && (
              <> <Link href={`/${cheapestSuburb.slug}`} className="text-amber font-bold hover:underline">{cheapestSuburb.name}</Link> runs cheapest right now at a ${parseFloat(cheapestSuburb.avgPrice).toFixed(2)} average; <Link href={`/${dearestSuburb.slug}`} className="text-amber font-bold hover:underline">{dearestSuburb.name}</Link> the dearest at ${parseFloat(dearestSuburb.avgPrice).toFixed(2)}.</>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search suburbs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-[400px] font-body text-[0.9rem] bg-white border-3 border-ink rounded-pill px-5 py-3 text-ink placeholder:text-gray-mid/50 focus:outline-none focus:ring-2 focus:ring-amber/30"
          />
        </div>

        {/* Letter nav */}
        <div className="flex flex-wrap gap-1 mb-6">
          {letters.map(letter => (
            <a
              key={letter}
              href={`#${letter}`}
              className="font-mono text-[0.7rem] font-bold w-8 h-8 flex items-center justify-center rounded-md text-gray-mid hover:text-amber hover:bg-amber-pale transition-colors no-underline"
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Suburb list grouped by letter */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-8 h-8 mx-auto text-gray-mid mb-3" />
            <p className="font-mono text-[0.85rem] font-bold text-ink">No suburbs found</p>
            <p className="text-[0.8rem] text-gray-mid mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-8">
            {letters.map(letter => (
              <div key={letter} id={letter}>
                <h2 className="font-mono text-[1.2rem] font-extrabold text-ink mb-3 border-b-2 border-ink pb-1">{letter}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  {grouped[letter].map(suburb => (
                    <Link
                      key={suburb.slug}
                      href={`/${suburb.slug}`}
                      className="flex items-center justify-between py-3 px-1 border-b border-gray-light/60 no-underline group hover:bg-white/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[0.82rem] font-bold text-ink group-hover:text-amber transition-colors">{suburb.name}</span>
                        <span className="font-mono text-[0.65rem] text-gray-mid ml-2">{suburb.pubCount} {suburb.pubCount === 1 ? 'pub' : 'pubs'}</span>
                      </div>
                      {suburb.cheapestPrice !== 'TBC' && (
                        <span className="font-mono text-[0.85rem] font-extrabold text-ink flex-shrink-0 ml-3">
                          ${suburb.cheapestPrice}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
