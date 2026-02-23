'use client'
import { Pub } from '@/types/pub'
import { CrowdReport } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { getPriceColor, getPriceBgColor, getDirectionsUrl, formatLastUpdated } from '@/lib/priceColors'
import PubCard from './PubCard'

interface PubCardsViewProps {
  pubs: Pub[]
  crowdReports: Record<string, CrowdReport>
  showMiniMaps: boolean
  userLocation: { lat: number; lng: number } | null
  sortBy: string
  onCrowdReport: (pub: Pub) => void
  showAll: boolean
  initialCount: number
  onShowAll: () => void
}

export default function PubCardsView({
  pubs,
  crowdReports,
  showMiniMaps,
  userLocation,
  sortBy,
  onCrowdReport,
  showAll,
  initialCount,
  onShowAll,
}: PubCardsViewProps) {
  const displayPubs = showAll ? pubs : pubs.slice(0, initialCount)

  function getLatestCrowdReport(pubId: number): CrowdReport | undefined {
    return crowdReports[String(pubId)]
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-16">
        {displayPubs.map((pub, index) => {
          const crowdReport = getLatestCrowdReport(pub.id)
          const happyHourStatus = getHappyHourStatus(pub.happyHour)
          return (
            <PubCard
              key={pub.id}
              pub={pub}
              index={index}
              sortBy={sortBy}
              showMiniMaps={showMiniMaps}
              crowdReport={crowdReport}
              happyHourStatus={happyHourStatus}
              getDirectionsUrl={getDirectionsUrl}
              getPriceColor={getPriceColor}
              getPriceBgColor={getPriceBgColor}
              formatLastUpdated={formatLastUpdated}
              onCrowdReport={onCrowdReport}
              distance={userLocation ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng)) : undefined}
            />
          )
        })}
      </div>
      {!showAll && pubs.length > initialCount && (
        <button
          onClick={onShowAll}
          className="w-full mt-4 py-3 text-sm font-medium text-charcoal hover:text-amber bg-white hover:bg-amber/5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/60 transition-colors flex items-center justify-center gap-1"
        >
          Show All {pubs.length} Venues
          <span className="inline-block">&#9660;</span>
        </button>
      )}
    </>
  )
}
