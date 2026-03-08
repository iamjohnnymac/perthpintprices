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

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Suburbs" subtitle={`${suburbs.length} suburbs`} />

      <div className="max-w-container mx-auto px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-amber" />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Browse</span>
          </div>
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1] mb-2">
            All Suburbs
          </h1>
          <p className="text-[0.9rem] text-gray-mid">
            {suburbs.length} suburbs across Perth. Find pint prices in your area.
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
                      href={`/suburb/${suburb.slug}`}
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
