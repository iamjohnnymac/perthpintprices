'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import E from '@/lib/emoji'
import InfoTooltip from './InfoTooltip'

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-amber-50 animate-pulse rounded" />,
})

interface SunsetSippersProps {
  pubs: Pub[]
}

// Perth coordinates
const PERTH_LAT = -31.9505
const PERTH_LNG = 115.8605

// Calculate sunrise/sunset for Perth using simplified solar calculation
function getSunTimes(date: Date): { sunrise: Date; sunset: Date; goldenHourStart: Date } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
  const lat = PERTH_LAT * Math.PI / 180

  // Solar declination
  const declination = -23.45 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI / 180) * Math.PI / 180

  // Hour angle
  const cosHourAngle = (Math.cos(90.833 * Math.PI / 180) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination))
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI

  // Solar noon (Perth is UTC+8, longitude 115.86)
  const solarNoon = 12 - (PERTH_LNG - 120) / 15 // 120 = UTC+8 reference meridian

  const sunriseHour = solarNoon - hourAngle / 15
  const sunsetHour = solarNoon + hourAngle / 15

  const sunrise = new Date(date)
  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0)

  const sunset = new Date(date)
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0)

  // Golden hour starts ~1 hour before sunset
  const goldenHourStart = new Date(sunset.getTime() - 60 * 60 * 1000)

  return { sunrise, sunset, goldenHourStart }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function getTimeUntil(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'now'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

// Sun position as percentage through the day (0 = sunrise, 100 = sunset)
function getSunPosition(now: Date, sunrise: Date, sunset: Date): number {
  const total = sunset.getTime() - sunrise.getTime()
  const elapsed = now.getTime() - sunrise.getTime()
  if (elapsed < 0) return 0
  if (elapsed > total) return 100
  return (elapsed / total) * 100
}

// Calculate sun azimuth (compass bearing in degrees, 0=North, 90=East, 180=South, 270=West)
function getSunAzimuth(date: Date): number {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
  const lat = PERTH_LAT * Math.PI / 180
  const declination = -23.45 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI / 180) * Math.PI / 180
  
  // Hour angle (negative = morning/east, positive = afternoon/west)
  const solarNoon = 12 - (PERTH_LNG - 120) / 15
  const hours = date.getHours() + date.getMinutes() / 60
  const hourAngle = (hours - solarNoon) * 15 * Math.PI / 180
  
  // Solar altitude
  const sinAlt = Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
  const altitude = Math.asin(sinAlt)
  
  // Solar azimuth
  const cosAz = (Math.sin(declination) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(altitude))
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI
  
  // Afternoon = west side (azimuth > 180)
  if (hourAngle > 0) azimuth = 360 - azimuth
  
  return azimuth
}

// Convert azimuth to CSS gradient direction for sun shadow effect
function getSunShadowGradient(azimuth: number, isGolden: boolean): string {
  // Shadow falls opposite to sun direction
  // CSS gradient: angle where 0deg = up, 90deg = right
  const gradientAngle = (azimuth + 180) % 360
  const color = isGolden ? 'rgba(251,191,36,' : 'rgba(251,191,36,'
  return `linear-gradient(${gradientAngle}deg, ${color}0.35) 0%, ${color}0.1) 40%, transparent 70%)`
}

export default function SunsetSippers({ pubs }: SunsetSippersProps) {
  const [now, setNow] = useState(new Date())
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllPubs, setShowAllPubs] = useState(false)
  const [apiSunriseHour, setApiSunriseHour] = useState<number | null>(null)
  const [apiSunsetHour, setApiSunsetHour] = useState<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000) // Update every 30s
    return () => clearInterval(timer)
  }, [])

  // Fetch accurate sunrise/sunset from Open-Meteo
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-31.9505&longitude=115.8605&daily=sunrise,sunset&timezone=Australia%2FPerth&forecast_days=1')
      .then(r => r.json())
      .then(data => {
        const sunriseISO: string = data.daily.sunrise[0] // e.g. "2026-02-19T06:12"
        const sunsetISO: string = data.daily.sunset[0]
        const [, srTime] = sunriseISO.split('T')
        const [, ssTime] = sunsetISO.split('T')
        const [srH, srM] = srTime.split(':').map(Number)
        const [ssH, ssM] = ssTime.split(':').map(Number)
        setApiSunriseHour(srH + srM / 60)
        setApiSunsetHour(ssH + ssM / 60)
      })
      .catch(() => {}) // Fall back to calculation silently
  }, [now.toDateString()])

  const sunTimes = useMemo(() => {
    if (apiSunriseHour !== null && apiSunsetHour !== null) {
      const sunrise = new Date(now)
      sunrise.setHours(Math.floor(apiSunriseHour), Math.round((apiSunriseHour % 1) * 60), 0, 0)
      const sunset = new Date(now)
      sunset.setHours(Math.floor(apiSunsetHour), Math.round((apiSunsetHour % 1) * 60), 0, 0)
      return { sunrise, sunset, goldenHourStart: new Date(sunset.getTime() - 60 * 60 * 1000) }
    }
    return getSunTimes(now)
  }, [apiSunriseHour, apiSunsetHour, now.toDateString()])
  const sunPosition = getSunPosition(now, sunTimes.sunrise, sunTimes.sunset)

  const sunsetPubs = useMemo(() =>
    pubs.filter(p => p.sunsetSpot && p.price !== null).sort((a, b) => a.price! - b.price!),
    [pubs]
  )

  const isGoldenHour = now >= sunTimes.goldenHourStart && now <= sunTimes.sunset
  const isSunset = now >= new Date(sunTimes.sunset.getTime() - 15 * 60000) && now <= new Date(sunTimes.sunset.getTime() + 30 * 60000)
  const isNighttime = now > sunTimes.sunset || now < sunTimes.sunrise
  const sunAzimuth = getSunAzimuth(now)
  const sunShadow = getSunShadowGradient(sunAzimuth, isGoldenHour || isSunset)
  const cheapestSunset = sunsetPubs[0]

  // Sun arc SVG dimensions — taller arc with room for labels below
  const arcWidth = 200
  const arcHeight = 72
  const arcCenterX = arcWidth / 2   // 100
  const arcCenterY = 46             // horizon line — lower gives taller visible arc
  const arcRx = 86                  // wide horizontal radius
  const arcRy = 42                  // taller vertical radius → more prominent arc

  // Sun position along the ellipse: angle goes PI (left/sunrise) → 0 (right/sunset)
  const sunAngle = Math.PI - (sunPosition / 100) * Math.PI
  const sunX = arcCenterX + arcRx * Math.cos(sunAngle)
  const sunY = arcCenterY - arcRy * Math.sin(sunAngle)

  // Status message
  let statusMessage = ''
  let statusEmoji = E.sun
  if (isSunset) {
    statusMessage = 'Sunset is happening RIGHT NOW!'
    statusEmoji = E.sunset
  } else if (isGoldenHour) {
    statusMessage = `Golden hour! Sunset in ${getTimeUntil(sunTimes.sunset, now)}`
    statusEmoji = E.cityscape_dusk
  } else if (isNighttime) {
    statusMessage = 'After dark ' + E.dash + ' plan tomorrow\'s sunset sesh'
    statusEmoji = E.crescent_moon
  } else {
    statusMessage = `Sunset in ${getTimeUntil(sunTimes.sunset, now)}`
    statusEmoji = E.sun
  }

  return (
    <Card
      className={`mb-4 border cursor-pointer transition-all duration-300 ${
        isGoldenHour || isSunset
          ? 'border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50'
          : isNighttime
          ? 'border-indigo-300 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50'
          : 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between overflow-visible">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusEmoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-800 text-sm flex items-center">Sunset Sippers<InfoTooltip text="Uses Perth's real-time sunset & golden hour times (calculated astronomically). Highlights west-facing pubs with verified prices — best spots to watch the sun go down with a pint." /></h3>
                {isGoldenHour && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 animate-pulse">
                    GOLDEN HOUR
                  </Badge>
                )}
                {isSunset && (
                  <Badge className="bg-orange-600 text-white text-[10px] px-1.5 py-0 animate-pulse">
                    SUNSET NOW
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500">{statusMessage}</p>
            </div>
          </div>

          {/* Mini Sun Dial */}
          <div className="flex items-center gap-3 overflow-visible">
            {!isNighttime && (
              <svg width={160} height={58} viewBox={`0 0 ${arcWidth} ${arcHeight}`} className="opacity-80" overflow="hidden" style={{display:'block'}}>
                {/* Horizon line */}
                <line x1="8" y1={arcCenterY} x2={arcWidth - 8} y2={arcCenterY} stroke="#d4a574" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                {/* Full arc (dashed guide) — flat ellipse */}
                <path
                  d={`M 12 ${arcCenterY} A ${arcRx} ${arcRy} 0 0 1 ${arcWidth - 12} ${arcCenterY}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.3"
                />
                {/* Traveled path — flat ellipse */}
                {sunPosition > 0 && sunPosition < 100 && (
                  <path
                    d={`M 12 ${arcCenterY} A ${arcRx} ${arcRy} 0 0 1 ${sunX} ${sunY}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                )}
                {/* Sun dot */}
                {sunPosition > 0 && sunPosition < 100 && (
                  <>
                    <circle cx={sunX} cy={sunY} r="10" fill="#fbbf24" opacity="0.15" />
                    <circle cx={sunX} cy={sunY} r="5" fill="#f59e0b" opacity="0.6" />
                    <circle cx={sunX} cy={sunY} r="3" fill="#f59e0b" />
                  </>
                )}
                {/* Labels — below horizon line, larger font, symmetric */}
                <text x="6" y={arcCenterY + 18} fontSize="11" fill="#92734a" fontFamily="monospace" fontWeight="500">{E.arrow_up_plain}{formatTime(sunTimes.sunrise).replace(' ', '')}</text>
                <text x={arcWidth - 70} y={arcCenterY + 18} fontSize="11" fill="#c2410c" fontFamily="monospace" fontWeight="500">{E.arrow_down_plain}{formatTime(sunTimes.sunset).replace(' ', '')}</text>
              </svg>
            )}

            <div className="text-right">
              <div className="text-lg font-bold text-amber-700">{formatTime(sunTimes.sunset)}</div>
              <div className="text-[10px] text-stone-400">sunset today</div>
            </div>

            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-amber-200/60">
            {/* Sunset Pubs Grid */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-stone-700">
                {E.beer} Best Sunset Spots ({sunsetPubs.length} pubs)
              </h4>
              {cheapestSunset && (
                <span className="text-xs text-emerald-600 font-medium">
                  Cheapest: {cheapestSunset.price !== null ? `$${cheapestSunset.price.toFixed(2)}` : 'TBC'} at {cheapestSunset.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sunsetPubs.slice(0, showAllPubs ? sunsetPubs.length : 6).map((pub) => (
                <div
                  key={pub.id}
                  className="rounded-xl bg-white/70 hover:bg-white/95 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md border border-amber-100 h-full flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Mini Map with Sun Shadow Overlay */}
                  <div className="relative h-28 w-full">
                    <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                    {/* Sun shadow overlay */}
                    {!isNighttime && (
                      <div
                        className="absolute inset-0 pointer-events-none z-[400]"
                        style={{ background: sunShadow }}
                      />
                    )}
                    {/* Sun direction indicator */}
                    {!isNighttime && (
                      <div className="absolute top-1.5 right-1.5 z-[500] bg-white/85 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                        <span className="text-xs">{E.sun}</span>
                        <svg width="14" height="14" viewBox="0 0 14 14" className="text-amber-500">
                          <g transform={`rotate(${sunAzimuth}, 7, 7)`}>
                            <line x1="7" y1="2" x2="7" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <polygon points="7,1 5.5,4 8.5,4" fill="currentColor" />
                          </g>
                        </svg>
                      </div>
                    )}
                    {isNighttime && (
                      <div className="absolute inset-0 pointer-events-none z-[400] bg-indigo-900/20" />
                    )}
                    {/* Price badge on map */}
                    <div className="absolute bottom-1.5 left-1.5 z-[500] bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                      <span className="text-sm font-bold text-amber-700">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                    </div>
                  </div>
                  {/* Pub info */}
                  <div className="p-2.5 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-800 truncate">{pub.name}</p>
                        <p className="text-[10px] text-stone-400">{pub.suburb}</p>
                      </div>
                      <span className="text-[10px] text-stone-400 flex-shrink-0 truncate max-w-[70px]">{pub.beerType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sunsetPubs.length > 6 && (
              <button
                className="w-full mt-2 text-xs text-amber-700 hover:text-amber-900 font-medium py-2 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowAllPubs(!showAllPubs); }}
              >
                {showAllPubs ? '▲ Show less' : `▼ Show all ${sunsetPubs.length} sunset spots`}
              </button>
            )}

            {/* Fun footer */}
            <div className={`mt-3 text-center text-xs py-2 rounded-lg ${
              isGoldenHour || isSunset
                ? 'bg-amber-100/60 text-amber-800'
                : isNighttime
                ? 'bg-indigo-100/60 text-indigo-700'
                : 'bg-amber-50 text-stone-500'
            }`}>
              {isSunset && E.sunset + ' Quick! Grab a pint and face west!'}
              {isGoldenHour && !isSunset && E.camera + ' Golden hour lighting ' + E.dash + ' your pint has never looked better'}
              {!isGoldenHour && !isSunset && !isNighttime && E.sun + ` Golden hour starts at ${formatTime(sunTimes.goldenHourStart)} ` + E.dash + ' plan your sesh'}
              {isNighttime && E.crescent_moon + ' The sun will rise again tomorrow ' + E.dash + ' rest up, champion'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
