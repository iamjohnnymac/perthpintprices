'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { Pub } from '@/types/pub'
import { CrowdReport } from '@/lib/supabase'
import { HappyHourStatus } from '@/lib/happyHour'
import E from '@/lib/emoji'
import WatchlistButton from '@/components/WatchlistButton'

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-stone-100 animate-pulse" />,
})

interface PubCardProps {
  pub: Pub
  index: number
  sortBy: string
  showMiniMaps: boolean
  crowdReport: CrowdReport | null | undefined
  happyHourStatus: HappyHourStatus
  getDirectionsUrl: (pub: Pub) => string
  getPriceColor: (price: number | null) => string
  getPriceBgColor: (price: number | null) => string
  formatLastUpdated: (date: string) => string
  onCrowdReport: (pub: Pub) => void
  distance?: string
}

export default function PubCard({
  pub,
  index,
  sortBy,
  showMiniMaps,
  crowdReport,
  happyHourStatus,
  getDirectionsUrl,
  getPriceColor,
  getPriceBgColor,
  formatLastUpdated,
  onCrowdReport,
  distance,
}: PubCardProps) {
  const router = useRouter()
  return (
    <Link href={`/pub/${pub.slug}`} className="block h-full">
      <div className="group relative isolate overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-stone-200/60 shadow-sm rounded-2xl h-full flex flex-col bg-white cursor-pointer">
        {/* Image area — 280px tall */}
        <div className="relative h-[200px] bg-stone-100">
          {pub.imageUrl ? (
            <img src={pub.imageUrl} alt={pub.name} className="w-full h-full object-cover" />
          ) : showMiniMaps ? (
            <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center">
              <span className="text-6xl opacity-20">🍺</span>
            </div>
          )}

          {/* Price badge — bottom left, overlapping image */}
          <span className="absolute bottom-3 left-3 z-[1000] font-mono font-bold text-lg bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
            {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
          </span>

          {/* Happy Hour badge — top left */}
          {happyHourStatus.isActive && (
            <Badge className="absolute top-3 left-3 z-[1000] bg-amber hover:bg-amber text-white animate-pulse text-xs">
              {E.party} HAPPY HOUR
            </Badge>
          )}

          {/* TAB badge — top right */}
          {pub.hasTab && (
            <Badge className="absolute top-3 right-3 z-[1000] text-white text-[10px] px-2 py-0.5" style={{ backgroundColor: '#5B2D8E' }}>
              TAB
            </Badge>
          )}
        </div>

        {/* Text area — minimal */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-semibold text-lg text-charcoal truncate flex items-center gap-2">
                {pub.name}
                <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="sm" />
              </h3>
              <p className="text-stone-500 text-base mt-0.5">
                {pub.suburb}{distance ? ` · ${distance}` : ''}
              </p>
            </div>
            {pub.isHappyHourNow && (
              <Badge className="bg-amber/10 text-amber border-amber/20 text-sm flex-shrink-0">
                🍻 HH
              </Badge>
            )}
          </div>
          {pub.beerType && (
            <p className="text-sm text-stone-400 mt-2 truncate">{pub.beerType}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
