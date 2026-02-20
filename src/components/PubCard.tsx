'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="h-24 bg-stone-100 animate-pulse" />
})
import CrowdBadge from './CrowdBadge'
import { Pub } from '@/types/pub'
import { CrowdReport } from '@/lib/supabase'
import { HappyHourStatus } from '@/lib/happyHour'

// Subtle directions pin icon
const DirectionsIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)

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
}: PubCardProps) {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border-stone-200 h-full flex flex-col">
      {/* Happy Hour active badge */}
      {happyHourStatus.isActive && (
        <Badge className="absolute top-2 left-2 z-10 bg-green-600 hover:bg-green-600 text-white animate-pulse">
          🎉 HAPPY HOUR!
        </Badge>
      )}

      {/* TAB badge */}
      {pub.hasTab && (
        <Badge className={`absolute top-2 ${happyHourStatus.isActive ? 'left-32' : 'left-2'} z-10 text-white text-[9px] px-1.5 py-0.5`} style={{ backgroundColor: '#5B2D8E' }}>
          TAB
        </Badge>
      )}

      {/* Mini map */}
      {showMiniMaps && (
        <div className="h-24 relative overflow-hidden">
          <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
        </div>
      )}

      <CardHeader className={`p-4 pb-2 ${!showMiniMaps ? 'pt-5' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <a
                href={getDirectionsUrl(pub)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-stone-300 hover:text-amber-500 transition-colors"
                title="Get directions"
              >
                <DirectionsIcon />
              </a>
              <h3 className="font-bold text-stone-900 truncate">{pub.name}</h3>
            </div>
            <p className="text-xs text-stone-500">{pub.suburb}</p>
          </div>
          <div className={`text-xl font-bold bg-gradient-to-br ${getPriceColor(pub.price)} bg-clip-text text-transparent`}>
            {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-2 flex-1">
        {crowdReport && <CrowdBadge report={crowdReport} />}

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-stone-500 bg-stone-100">
          🍺 {pub.beerType}
        </span>

        <p className="text-xs text-stone-600">📍 {pub.address}</p>

        {pub.happyHour && (
          <div className={`text-xs flex items-center gap-1 ${
            happyHourStatus.isActive ? 'text-green-600 font-bold' : 
            happyHourStatus.isToday ? 'text-amber-600 font-semibold' : 
            'text-stone-500'
          }`}>
            <span>{happyHourStatus.statusEmoji}</span>
            <span>{happyHourStatus.statusText}</span>
            {happyHourStatus.countdown && happyHourStatus.isActive && (
              <span className="text-green-500 font-normal">• {happyHourStatus.countdown}</span>
            )}
          </div>
        )}

        {pub.description && (
          <p className="text-xs text-stone-500 line-clamp-2 italic">\"{pub.description}\"</p>
        )}

        {pub.lastUpdated && (
          <p className="text-xs text-stone-400">Updated: {formatLastUpdated(pub.lastUpdated)}</p>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 border-t border-stone-100 flex items-center justify-between">
        {pub.website ? (
          <a
            href={pub.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 hover:text-amber-800 text-xs font-semibold"
          >
            Visit website →
          </a>
        ) : (
          <div></div>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onCrowdReport(pub)}
          className="text-xs h-7"
        >
          How busy?
        </Button>
      </CardFooter>
    </Card>
  )
}
