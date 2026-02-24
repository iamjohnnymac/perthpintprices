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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          className="w-full mt-4 py-3 text-sm font-medium text-charcoal hover:text-amber bg-white hover:bg-cream rounded-2xl border border-stone-200/60 transition-colors flex items-center justify-center gap-1"
        >
          +{pubs.length - initialCount} more pubs
        </button>
      )}
    </>
  )
}
