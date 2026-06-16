'use client'

import { Pub } from '@/types/pub'
import { CrowdReport } from '@/lib/supabase'
import { getDistanceKm, formatDistance } from '@/lib/location'
import Link from 'next/link'
import { Beer } from 'lucide-react'
import { pubUrl } from '@/lib/urls'

interface PubCardListProps {
  pubs: Pub[]
  crowdReports: Record<string, CrowdReport>
  userLocation: { lat: number; lng: number } | null
  onCrowdReport: (pub: Pub) => void
  showAll: boolean
  initialCount: number
  onShowAll: () => void
  onHoverPub?: (pubId: number | null) => void
}

export default function PubCardList({
  pubs,
  userLocation,
  showAll,
  initialCount,
  onShowAll,
}: PubCardListProps) {
  const displayPubs = showAll ? pubs : pubs.slice(0, initialCount)

  // The chip marks the genuinely cheapest priced pub in view, not row one —
  // the list can be sorted by name or distance.
  const cheapestId = displayPubs.reduce<{ id: number; price: number } | null>(
    (min, pub) => (pub.price !== null && (min === null || pub.price < min.price) ? { id: pub.id, price: pub.price } : min),
    null,
  )?.id ?? null

  return (
    <div className="max-w-container mx-auto px-6">
      {/* List header */}
      <div className="flex justify-between py-4 pb-2.5 border-b-3 border-ink">
        <span className="type-eyebrow">Pub</span>
        <span className="type-eyebrow">Pint</span>
      </div>

      {/* Empty state */}
      {pubs.length === 0 && (
        <div className="py-16 text-center">
          <div className="mb-3"><Beer className="w-8 h-8 mx-auto text-gray-mid" /></div>
          <p className="font-body text-base font-semibold text-ink mb-1">No pubs found</p>
          <p className="font-body text-[0.85rem] text-gray-mid">Try changing your filters or expanding your search radius.</p>
        </div>
      )}

      {/* Pub rows */}
      {displayPubs.map((pub, index) => {
        const distanceKm = userLocation
          ? getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)
          : null
        const distance = distanceKm !== null && distanceKm <= 500
          ? formatDistance(distanceKm)
          : null

        return (
          <Link
            key={pub.id}
            href={pubUrl(pub)}
            className="flex items-baseline justify-between py-3.5 px-2.5 -mx-2.5 border-b border-gray-light rounded-lg cursor-pointer no-underline text-ink hover:bg-off-white transition-colors"
          >
            {/* Rank */}
            <span className="font-mono text-[0.75rem] font-bold min-w-[28px] mr-1 text-gray-mid">
              {index + 1}.
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="font-body text-base font-bold text-ink">
                {pub.name}
                {pub.id === cheapestId && (
                  <span className="font-mono text-[0.5rem] font-bold uppercase tracking-[0.06em] px-1.5 py-[2px] rounded-pill ml-1.5 bg-amber text-ink inline-block align-middle -translate-y-px">
                    Cheapest
                  </span>
                )}
                {pub.isHappyHourNow && (
                  <span className="font-mono text-[0.5rem] font-bold uppercase tracking-[0.06em] px-1.5 py-[2px] rounded-pill ml-1.5 border border-red bg-red-pale text-red inline-block align-middle -translate-y-px">
                    HH
                  </span>
                )}
              </span>
              <span className="font-body text-[0.78rem] text-gray-mid mt-0.5 block">
                {pub.suburb}
                {distance && ` · ${distance}`}
                {pub.beerType && ` · ${pub.beerType}`}
              </span>
              {pub.isHappyHourNow && pub.happyHour && (
                <span className="font-mono text-[0.7rem] text-red font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />
                  {pub.happyHour}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-right min-w-[70px]">
              <span className="type-price text-[1.1rem]">
                {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
              </span>
            </div>
          </Link>
        )
      })}

      {/* View all CTA */}
      {!showAll && pubs.length > initialCount && (
        <div className="pt-2 pb-10">
          <button
            onClick={onShowAll}
            className="w-full font-mono text-[0.85rem] font-bold uppercase tracking-[0.06em] text-ink bg-amber border-3 border-ink rounded-pill py-[18px] px-8 shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
          >
            View all {pubs.length} venues →
          </button>
        </div>
      )}
    </div>
  )
}
