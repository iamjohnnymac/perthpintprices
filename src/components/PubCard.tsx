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

// Google Maps icon SVG
const GoogleMapsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 92.3 132.3" fill="none">
    <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
    <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
    <path fill="#4285f4" d="M46.1 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.7-3.9 8.8-6.3 13.5-6.3z"/>
    <path fill="#fbbc04" d="M46.1 63.5c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.6-8.3 4.2-11.4L4.6 68.1C11.3 81.8 24.8 99.7 46.1 132.3c6.7-10.2 12.7-19.1 17.9-27.1L46.1 63.5z"/>
    <path fill="#34a853" d="M59.6 57.6c2.6-3.1 4.2-7.1 4.2-11.4 0-9.8-7.9-17.7-17.7-17.7-4.7 0-9.8 2.4-13.5 6.3L64 105.2c14.5-23.3 23.2-40.5 23.2-59.1 0-5.8-.8-11.3-2.4-16.4L59.6 57.6z"/>
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
      {/* Rank badge for top 3 */}
      {index < 3 && sortBy === 'price' && (
        <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md z-10 ${
          index === 0 ? 'bg-yellow-500' :
          index === 1 ? 'bg-stone-400' :
          'bg-amber-700'
        }`}>
          #{index + 1}
        </div>
      )}

      {/* Happy Hour active badge */}
      {happyHourStatus.isActive && (
        <Badge className="absolute top-2 left-2 z-10 bg-green-600 hover:bg-green-600 text-white animate-pulse">
          🎉 HAPPY HOUR!
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
                className="flex-shrink-0 hover:scale-110 transition-transform"
                title="Get directions in Google Maps"
              >
                <GoogleMapsIcon />
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

        <Badge className={`${getPriceBgColor(pub.price)} hover:opacity-90 text-white`}>
          🍺 {pub.beerType}
        </Badge>

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
