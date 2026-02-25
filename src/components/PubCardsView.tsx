'use client'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import PubCard from './PubCard'

interface PubCardsViewProps {
  pubs: Pub[]
  userLocation: { lat: number; lng: number } | null
  avgPrice?: number
  showAll: boolean
  initialCount: number
  onShowAll: () => void
}

export default function PubCardsView({
  pubs,
  userLocation,
  avgPrice = 9.20,
  showAll,
  initialCount,
  onShowAll,
}: PubCardsViewProps) {
  const displayPubs = showAll ? pubs : pubs.slice(0, initialCount)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {displayPubs.map((pub) => (
          <PubCard
            key={pub.id}
            pub={pub}
            avgPrice={avgPrice}
            distance={userLocation ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)) : undefined}
          />
        ))}
      </div>
      {!showAll && pubs.length > initialCount && (
        <button
          onClick={onShowAll}
          className="w-full mt-5 py-3.5 text-sm font-semibold text-charcoal bg-white hover:bg-cream rounded-full border border-stone-200/60 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          View all {pubs.length} pubs
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
      )}
    </>
  )
}
