'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MapPin, ShieldCheck, TrendingDown } from 'lucide-react'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { SuburbInfo } from '@/lib/supabase'

interface SuburbsClientProps {
  suburbs: SuburbInfo[]
}

function parsePrice(value: string): number | null {
  const price = Number(value)
  return Number.isFinite(price) && price > 0 ? price : null
}

function formatPrice(value: number | string): string {
  const price = typeof value === 'string' ? parsePrice(value) : value
  if (!price) return 'TBC'
  return price % 1 === 0 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
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
  const withAvg = suburbs
    .map(suburb => ({ suburb, avgPrice: parsePrice(suburb.avgPrice) }))
    .filter((item): item is { suburb: SuburbInfo; avgPrice: number } => item.avgPrice !== null)
    .sort((a, b) => a.avgPrice - b.avgPrice)
  const cheapestSuburb = withAvg[0]?.suburb ?? null
  const dearestSuburb = withAvg.length ? withAvg[withAvg.length - 1].suburb : null
  const suburbAverageLeaders = withAvg
    .filter(({ suburb }) => suburb.pubCount >= 2)
    .slice(0, 4)
  const coverageLeaders = [...suburbs]
    .map(suburb => ({ suburb, checkedCount: parsePrice(suburb.avgPrice) !== null ? suburb.verifiedCount : 0 }))
    .filter(item => item.checkedCount > 0)
    .sort((a, b) => b.checkedCount - a.checkedCount || b.suburb.pubCount - a.suburb.pubCount || a.suburb.name.localeCompare(b.suburb.name))
    .slice(0, 4)
  const happyHourLeaders = [...suburbs]
    .filter(suburb => suburb.pubCount >= 2 && suburb.happyHourCount > 0)
    .sort((a, b) => (b.happyHourCount / b.pubCount) - (a.happyHourCount / a.pubCount) || b.happyHourCount - a.happyHourCount || a.name.localeCompare(b.name))
    .slice(0, 4)

  const dataRails = [
    {
      title: 'Lowest suburb averages',
      caption: 'At least 2 pubs in the suburb dataset.',
      Icon: TrendingDown,
      items: suburbAverageLeaders.map(({ suburb, avgPrice }) => ({
        href: `/${suburb.slug}`,
        name: suburb.name,
        meta: plural(suburb.pubCount, 'pub'),
        value: formatPrice(avgPrice),
      })),
    },
    {
      title: 'Strongest checked coverage',
      caption: 'Suburbs with the most verified pub prices.',
      Icon: ShieldCheck,
      items: coverageLeaders.map(({ suburb, checkedCount }) => ({
        href: `/${suburb.slug}`,
        name: suburb.name,
        meta: `${checkedCount} of ${plural(suburb.pubCount, 'pub')} checked`,
        value: `${checkedCount}/${suburb.pubCount}`,
      })),
    },
    {
      title: 'Happy-hour dense suburbs',
      caption: 'Deal notes only. Times and prices still vary by pub.',
      Icon: Clock,
      items: happyHourLeaders.map(suburb => ({
        href: `/${suburb.slug}`,
        name: suburb.name,
        meta: `${suburb.happyHourCount} of ${plural(suburb.pubCount, 'pub')} with notes`,
        value: `${suburb.happyHourCount}/${suburb.pubCount}`,
      })),
    },
  ]

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Suburbs" subtitle={`${suburbs.length} suburbs`} />

      <div className="max-w-container mx-auto px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="type-hero mb-2">
            Pint prices by Perth suburb
          </h1>
          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid">
            Every Perth suburb we cover, with the cheapest pint, the average, and how many pubs — <span className="text-ink font-bold">{suburbs.length}</span> suburbs, <span className="text-ink font-bold">{venueCount}</span> pubs, each price showing when we last checked.
            {cheapestSuburb && dearestSuburb && cheapestSuburb.slug !== dearestSuburb.slug && (
              <> <Link href={`/${cheapestSuburb.slug}`} className="text-amber font-bold hover:underline">{cheapestSuburb.name}</Link> runs cheapest right now at a {formatPrice(cheapestSuburb.avgPrice)} average; <Link href={`/${dearestSuburb.slug}`} className="text-amber font-bold hover:underline">{dearestSuburb.name}</Link> the dearest at {formatPrice(dearestSuburb.avgPrice)}.</>
            )}
          </p>
        </div>

        {/* Data rails */}
        <section className="mb-8" aria-labelledby="suburb-data-rails">
          <div className="mb-4">
            <h2 id="suburb-data-rails" className="font-mono text-[1rem] font-extrabold text-ink">
              Where the suburb data is strongest
            </h2>
            <p className="mt-1 font-body text-[0.8rem] leading-relaxed text-gray-mid">
              Averages use priced pubs only. Suburbs with TBC prices still sit in the A-Z list below.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {dataRails.map(({ title, caption, Icon, items }) => (
              <div key={title} className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-pill border-3 border-ink bg-amber-pale text-ink">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="type-card">{title}</h3>
                    <p className="mt-1 font-body text-[0.72rem] leading-snug text-gray-mid">{caption}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-card border border-gray-light/70 bg-off-white px-3 py-2 no-underline transition-colors hover:border-amber hover:bg-amber-pale"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[0.76rem] font-bold text-ink">{item.name}</span>
                        <span className="block font-mono text-[0.62rem] leading-snug text-gray-mid">{item.meta}</span>
                      </span>
                      <span className="flex-shrink-0 font-mono text-[0.82rem] font-extrabold text-ink">{item.value}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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
                          {formatPrice(suburb.cheapestPrice)}
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
