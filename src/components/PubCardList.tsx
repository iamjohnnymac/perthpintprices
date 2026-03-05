'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Pub } from '@/types/pub'
import { CrowdReport, CROWD_LEVELS } from '@/lib/supabase'
import { getHappyHourStatus } from '@/lib/happyHour'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { getFreshness, formatVerifiedDate } from '@/lib/freshness'
import WatchlistButton from '@/components/WatchlistButton'
import { Sunset } from 'lucide-react'
import LucideIcon from '@/components/LucideIcon'
import { getMapTileUrl } from '@/lib/mapTile'

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

/** Get price badge color classes based on price tier */
function getPriceBadgeClasses(price: number | null): string {
  if (price === null) return 'bg-stone-100 text-stone-400 text-xs'
  if (price <= 7) return 'bg-orange-50 text-charcoal'
  if (price <= 9) return 'bg-amber-50 text-amber-700'
  if (price <= 11) return 'bg-orange-50 text-orange-700'
  return 'bg-red-50 text-red-600'
}

interface PubGroup {
  key: string
  label: string
  emoji: string
  pubs: Pub[]
}

/** Group pubs by happy hour status for smart display */
function groupPubs(pubs: Pub[]): PubGroup[] {
  const activeHH: Pub[] = []
  const soonHH: Pub[] = []
  const rest: Pub[] = []

  for (const pub of pubs) {
    const hhStatus = getHappyHourStatus(pub.happyHour)
    if (hhStatus.isActive) {
      activeHH.push(pub)
    } else if (hhStatus.isToday && hhStatus.countdown) {
      soonHH.push(pub)
    } else {
      rest.push(pub)
    }
  }

  const groups: PubGroup[] = []
  if (activeHH.length > 0) {
    groups.push({ key: 'active', label: 'Happy hour now', emoji: '🟢', pubs: activeHH })
  }
  if (soonHH.length > 0) {
    groups.push({ key: 'soon', label: 'Starting soon', emoji: 'clock', pubs: soonHH })
  }
  if (rest.length > 0) {
    groups.push({ key: 'nearby', label: 'Nearby', emoji: 'map-pin', pubs: rest })
  }
  return groups
}

function PubCard({
  pub,
  crowdReport,
  userLocation,
  onCrowdReport,
  onHoverPub,
}: {
  pub: Pub
  crowdReport?: CrowdReport
  userLocation: { lat: number; lng: number } | null
  onCrowdReport: (pub: Pub) => void
  onHoverPub?: (pubId: number | null) => void
}) {
  const router = useRouter()
  const hhStatus = getHappyHourStatus(pub.happyHour)
  const freshness = getFreshness(pub.lastVerified)
  const distance = userLocation
    ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))
    : null

  const priceClasses = getPriceBadgeClasses(pub.price)
  const isActiveHH = hhStatus.isActive

  return (
    <div
      className={`relative bg-white rounded-[10px] px-3.5 py-3 cursor-pointer transition-all duration-150 border hover:shadow-md hover:border-stone-200 overflow-hidden ${
        isActiveHH ? 'border-l-[3px] border-l-orange-500 border-t-transparent border-r-transparent border-b-transparent' : 'border-transparent'
      }`}
      onClick={() => router.push(`/pub/${pub.slug}`)}
      onMouseEnter={() => onHoverPub?.(pub.id)}
      onMouseLeave={() => onHoverPub?.(null)}
    >
      {/* Faded location map on right side */}
      {pub.lat && pub.lng && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url(${getMapTileUrl(pub.lat, pub.lng, 15)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'sepia(0.3) saturate(0.7)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
          }}
          aria-hidden="true"
        />
      )}
      {/* Row 1: Name + Price */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-semibold text-[15px] text-charcoal truncate leading-tight">
            {pub.name}
          </span>
          <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="sm" />
        </div>
        <span className={`font-mono text-[15px] font-medium whitespace-nowrap px-2 py-0.5 rounded-md ${priceClasses}`}>
          {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
        </span>
      </div>

      {/* Row 2: Meta */}
      <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-400 flex-wrap">
        <span>{pub.suburb}</span>
        {distance && (
          <>
            <span className="text-stone-300">·</span>
            <span className="inline-flex items-center gap-0.5">
              <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {distance}
            </span>
          </>
        )}
        {pub.beerType && (
          <>
            <span className="text-stone-300">·</span>
            <span className="truncate max-w-[180px]">{pub.beerType}</span>
          </>
        )}
      </div>

      {/* Row 3: Tags — all in a single flow, left-aligned */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* Happy hour badge */}
        {hhStatus.isActive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-charcoal text-xs font-medium">
            <span className="w-[6px] h-[6px] rounded-full bg-orange-500 animate-pulse" />
            Ends in {hhStatus.countdown?.replace(' left', '')}
          </span>
        )}
        {!hhStatus.isActive && hhStatus.isToday && hhStatus.countdown && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
            <span className="w-[5px] h-[5px] rounded-full bg-amber" />
            {hhStatus.countdown} — {pub.happyHour}
          </span>
        )}

        {/* Freshness pill */}
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${freshness.color} bg-stone-50`} title={formatVerifiedDate(pub.lastVerified)}>
          <span className="text-[10px]">{freshness.icon}</span>
          {freshness.label}
        </span>

        {/* Optional tags */}
        {pub.sunsetSpot && (
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 px-2 py-0.5 rounded-full bg-stone-50"><Sunset className="w-3 h-3 inline" /> Sunset</span>
        )}
        {pub.vibeTag && (
          <span className="text-[11px] text-stone-400 px-2 py-0.5 rounded-full bg-stone-50">{pub.vibeTag}</span>
        )}

        {/* Crowd report */}
        {crowdReport && (
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 px-2 py-0.5 rounded-full bg-stone-50" title={`${crowdReport.minutes_ago}m ago`}>
            <LucideIcon name={CROWD_LEVELS[crowdReport.crowd_level].emoji} className="w-3 h-3 inline" /> {CROWD_LEVELS[crowdReport.crowd_level].label}
          </span>
        )}
        {!crowdReport && (
          <button
            onClick={(e) => { e.stopPropagation(); onCrowdReport(pub) }}
            className="text-stone-300 hover:text-amber transition-colors p-0.5"
            title="Report crowd level"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.208V4.792a2 2 0 012.228-1.92L15 4.792m0 14.336V4.792" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function PubCardList({
  pubs,
  crowdReports,
  userLocation,
  onCrowdReport,
  showAll,
  initialCount,
  onShowAll,
  onHoverPub,
}: PubCardListProps) {
  const displayPubs = showAll ? pubs : pubs.slice(0, initialCount)
  const groups = useMemo(() => groupPubs(displayPubs), [displayPubs])

  // If there are no HH groups (e.g. late night), just show flat list
  const hasGroups = groups.length > 1 || (groups.length === 1 && groups[0].key !== 'nearby')

  function getLatestCrowdReport(pubId: number): CrowdReport | undefined {
    return crowdReports[String(pubId)]
  }

  return (
    <div className="flex flex-col gap-1.5">
      {hasGroups ? (
        groups.map((group) => (
          <div key={group.key}>
            {/* Section divider */}
            <div className="flex items-center gap-2 pt-3 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <LucideIcon name={group.emoji} className="w-4 h-4 inline" /> {group.label}
              </span>
              <div className="flex-1 h-px bg-stone-200/60" />
            </div>
            {/* Pub cards */}
            <div className="flex flex-col gap-1.5">
              {group.pubs.map((pub) => (
                <PubCard
                  key={pub.id}
                  pub={pub}
                  crowdReport={getLatestCrowdReport(pub.id)}
                  userLocation={userLocation}
                  onCrowdReport={onCrowdReport}
                  onHoverPub={onHoverPub}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col gap-1.5">
          {displayPubs.map((pub) => (
            <PubCard
              key={pub.id}
              pub={pub}
              crowdReport={getLatestCrowdReport(pub.id)}
              userLocation={userLocation}
              onCrowdReport={onCrowdReport}
              onHoverPub={onHoverPub}
            />
          ))}
        </div>
      )}

      {/* Show all button */}
      {!showAll && pubs.length > initialCount && (
        <button
          onClick={onShowAll}
          className="w-full py-3.5 text-sm font-semibold text-charcoal hover:text-amber hover:bg-cream/50 transition-all flex items-center justify-center gap-2 bg-white rounded-[10px] mt-1"
        >
          View all {pubs.length} venues
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
    </div>
  )
}
