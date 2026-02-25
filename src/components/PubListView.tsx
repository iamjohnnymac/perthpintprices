'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pub } from '@/types/pub'
import { CrowdReport, CROWD_LEVELS } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { getPriceTextColor, getDirectionsUrl } from '@/lib/priceColors'
import WatchlistButton from '@/components/WatchlistButton'

type SortKey = 'name' | 'suburb' | 'price' | 'beer' | null
type SortDir = 'asc' | 'desc'

interface PubListViewProps {
  pubs: Pub[]
  crowdReports: Record<string, CrowdReport>
  userLocation: { lat: number; lng: number } | null
  onCrowdReport: (pub: Pub) => void
  showAll: boolean
  initialCount: number
  onShowAll: () => void
}

export default function PubListView({
  pubs,
  crowdReports,
  userLocation,
  onCrowdReport,
  showAll,
  initialCount,
  onShowAll,
}: PubListViewProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'price' ? 'asc' : 'asc')
    }
  }

  const sortedPubs = useMemo(() => {
    if (!sortKey) return pubs
    const sorted = [...pubs]
    const dir = sortDir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'suburb':
          return dir * (a.suburb || '').localeCompare(b.suburb || '')
        case 'price': {
          const ap = a.price ?? 999
          const bp = b.price ?? 999
          return dir * (ap - bp)
        }
        case 'beer':
          return dir * (a.beerType || '').localeCompare(b.beerType || '')
        default:
          return 0
      }
    })
    return sorted
  }, [pubs, sortKey, sortDir])

  const displayPubs = showAll ? sortedPubs : sortedPubs.slice(0, initialCount)

  function getLatestCrowdReport(pubId: number): CrowdReport | undefined {
    return crowdReports[String(pubId)]
  }

  function SortHeader({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) {
    const isActive = sortKey === field
    return (
      <th
        className={`py-3 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none hover:text-amber transition-colors ${isActive ? 'text-amber' : 'text-stone-500'} ${className}`}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive && (
            <span className="text-[9px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
          )}
        </span>
      </th>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-cream border-b border-stone-200/60">
            <SortHeader label="Pub" field="name" className="text-left" />
            <SortHeader label="Suburb" field="suburb" className="text-left hidden sm:table-cell" />
            <SortHeader label="Beer" field="beer" className="text-left hidden sm:table-cell" />
            <SortHeader label="Price" field="price" className="text-right" />
            <th className="text-left py-3 px-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Happy Hour</th>
            <th className="text-center py-3 px-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Crowd</th>
          </tr>
        </thead>
        <tbody>
          {displayPubs.map((pub, index) => {
            const crowdReport = getLatestCrowdReport(pub.id)
            const happyHourStatus = getHappyHourStatus(pub.happyHour)
            return (
              <tr
                key={pub.id}
                className="border-b border-stone-100/80 hover:bg-cream/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/pub/${pub.slug}`)}
              >
                <td className="py-3 px-2 sm:px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-300 w-5 text-right tabular-nums">{index + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <a
                          href={getDirectionsUrl(pub)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 text-stone-300 hover:text-amber transition-colors"
                          title="Get directions"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </a>
                        <Link href={`/pub/${pub.slug}`} className="font-semibold text-charcoal text-sm hover:text-amber transition-colors">{pub.name}</Link>
                        <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="sm" />
                      </div>
                      <p className="text-xs text-stone-warm sm:hidden">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-sm text-stone-warm hidden sm:table-cell">
                  {pub.suburb}
                  {userLocation && <span className="text-stone-400 text-xs ml-1">· {formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}</span>}
                </td>
                <td className="py-3 px-3 hidden sm:table-cell">
                  <span className="text-xs text-stone-warm truncate max-w-[120px] block">
                    {pub.beerType || '—'}
                  </span>
                </td>
                <td className={`py-3 px-2 sm:px-3 text-right font-bold font-mono text-lg whitespace-nowrap ${getPriceTextColor(pub.price)}`}>
                  {pub.isHappyHourNow && pub.regularPrice !== null && pub.regularPrice !== pub.price && (
                    <span className="text-xs text-stone-400 line-through font-normal mr-1">${pub.regularPrice.toFixed(2)}</span>
                  )}
                  {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  {pub.happyHour ? (
                    <span className={`text-xs ${
                      happyHourStatus.isActive ? 'text-amber font-bold' :
                      happyHourStatus.isToday ? 'text-amber-dark font-semibold' :
                      'text-stone-warm'
                    }`}>
                      {happyHourStatus.statusEmoji} {happyHourStatus.statusText}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {crowdReport ? (
                    <span className="text-sm" title={`${crowdReport.minutes_ago}m ago`}>
                      {CROWD_LEVELS[crowdReport.crowd_level].emoji}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCrowdReport(pub); }}
                      className="text-xs text-stone-400 hover:text-amber"
                    >
                      Report
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!showAll && pubs.length > initialCount && (
        <button
          onClick={onShowAll}
          className="w-full py-3.5 text-sm font-semibold text-charcoal hover:text-amber hover:bg-cream/50 transition-all flex items-center justify-center gap-2 border-t border-stone-200/60"
        >
          View all {pubs.length} venues
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
      )}
    </div>
  )
}
