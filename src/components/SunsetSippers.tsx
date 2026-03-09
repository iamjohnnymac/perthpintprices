'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { getHappyHourStatus } from '@/lib/happyHour'
import { Sun, Sunset, Moon, Beer } from 'lucide-react'

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-off-white animate-pulse rounded-card" />,
})

interface SunsetSippersProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
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
  const gradientAngle = (azimuth + 180) % 360
  const color = isGolden ? 'rgba(212,116,10,' : 'rgba(212,116,10,'
  return `linear-gradient(${gradientAngle}deg, ${color}0.3) 0%, ${color}0.08) 40%, transparent 70%)`
}

export default function SunsetSippers({ pubs, userLocation }: SunsetSippersProps) {
  const [now, setNow] = useState(new Date())
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
        const sunriseISO: string = data.daily.sunrise[0]
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
    pubs.filter(p => p.sunsetSpot && p.price !== null).sort((a, b) => {
      if (userLocation) {
        return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      }
      return a.price! - b.price!
    }),
    [pubs, userLocation]
  )

  const isGoldenHour = now >= sunTimes.goldenHourStart && now <= sunTimes.sunset
  const isSunset = now >= new Date(sunTimes.sunset.getTime() - 15 * 60000) && now <= new Date(sunTimes.sunset.getTime() + 30 * 60000)
  const isNighttime = now > sunTimes.sunset || now < sunTimes.sunrise
  const sunAzimuth = getSunAzimuth(now)
  const sunShadow = getSunShadowGradient(sunAzimuth, isGoldenHour || isSunset)
  const cheapestSunset = sunsetPubs[0]

  // Sun arc SVG dimensions
  const arcWidth = 240
  const arcHeight = 80
  const arcCenterX = arcWidth / 2
  const arcCenterY = 52
  const arcRx = 100
  const arcRy = 46

  // Sun position along the ellipse: angle goes PI (left/sunrise) → 0 (right/sunset)
  const sunAngle = Math.PI - (sunPosition / 100) * Math.PI
  const sunX = arcCenterX + arcRx * Math.cos(sunAngle)
  const sunY = arcCenterY - arcRy * Math.sin(sunAngle)

  // Status message and icon
  let statusMessage = ''
  let StatusIcon = Sun
  if (isSunset) {
    statusMessage = 'Sunset is happening right now!'
    StatusIcon = Sunset
  } else if (isGoldenHour) {
    statusMessage = `Golden hour! Sunset in ${getTimeUntil(sunTimes.sunset, now)}`
    StatusIcon = Sunset
  } else if (isNighttime) {
    statusMessage = 'After dark. Plan tomorrow\'s sunset sesh'
    StatusIcon = Moon
  } else {
    statusMessage = `Sunset in ${getTimeUntil(sunTimes.sunset, now)}`
    StatusIcon = Sun
  }

  const displayPubs = showAllPubs ? sunsetPubs : sunsetPubs.slice(0, 10)

  return (
    <div className="space-y-8">
      {/* ═══ Sunset Hero ═══ */}
      <section>
        <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden">
          <div className="px-5 py-4 border-b-3 border-ink bg-ink">
            <h2 className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white">
              Today&apos;s Sunset
            </h2>
          </div>
          <div className="p-5 text-center">
            {/* Status pill */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <StatusIcon className="w-5 h-5 text-amber" />
              {isGoldenHour && (
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] px-2.5 py-1 rounded-pill border-2 border-amber bg-amber-pale text-amber">
                  Golden Hour
                </span>
              )}
              {isSunset && (
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] px-2.5 py-1 rounded-pill border-2 border-amber bg-amber text-white">
                  Sunset Now
                </span>
              )}
              {isNighttime && (
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] px-2.5 py-1 rounded-pill border-2 border-gray-light bg-off-white text-gray-mid">
                  After Dark
                </span>
              )}
            </div>

            {/* Large sunset time */}
            <div className="font-mono text-[2.5rem] font-extrabold text-ink leading-none mb-1">
              {formatTime(sunTimes.sunset)}
            </div>
            <p className="font-mono text-[0.85rem] text-gray-mid mb-5">
              {statusMessage}
            </p>

            {/* Sun arc visualization */}
            {!isNighttime && (
              <div className="flex justify-center mb-3">
                <svg width={arcWidth} height={arcHeight} viewBox={`0 0 ${arcWidth} ${arcHeight}`} className="opacity-90" overflow="hidden">
                  {/* Horizon line */}
                  <line x1="12" y1={arcCenterY} x2={arcWidth - 12} y2={arcCenterY} stroke="#8A8A85" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                  {/* Full arc (dashed guide) */}
                  <path
                    d={`M 16 ${arcCenterY} A ${arcRx} ${arcRy} 0 0 1 ${arcWidth - 16} ${arcCenterY}`}
                    fill="none"
                    stroke="#8A8A85"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    opacity="0.3"
                  />
                  {/* Traveled path */}
                  {sunPosition > 0 && sunPosition < 100 && (
                    <path
                      d={`M 16 ${arcCenterY} A ${arcRx} ${arcRy} 0 0 1 ${sunX} ${sunY}`}
                      fill="none"
                      stroke="#171717"
                      strokeWidth="2"
                      opacity="0.7"
                    />
                  )}
                  {/* Sun dot */}
                  {sunPosition > 0 && sunPosition < 100 && (
                    <>
                      <circle cx={sunX} cy={sunY} r="10" fill="#D4740A" opacity="0.12" />
                      <circle cx={sunX} cy={sunY} r="5" fill="#D4740A" opacity="0.5" />
                      <circle cx={sunX} cy={sunY} r="3" fill="#D4740A" />
                    </>
                  )}
                  {/* Labels */}
                  <text x="8" y={arcCenterY + 16} fontSize="10" fill="#8A8A85" fontFamily="monospace" fontWeight="600">
                    {formatTime(sunTimes.sunrise).replace(' ', '')}
                  </text>
                  <text x={arcWidth - 78} y={arcCenterY + 16} fontSize="10" fill="#D4740A" fontFamily="monospace" fontWeight="600">
                    {formatTime(sunTimes.sunset).replace(' ', '')}
                  </text>
                </svg>
              </div>
            )}

            {/* Nighttime arc placeholder */}
            {isNighttime && (
              <div className="flex justify-center mb-3">
                <div className="bg-off-white rounded-card px-6 py-3">
                  <p className="font-mono text-[0.7rem] text-gray-mid">
                    Sunrise tomorrow at {formatTime(sunTimes.sunrise)}
                  </p>
                </div>
              </div>
            )}

            {/* Golden hour start note */}
            {!isNighttime && !isGoldenHour && !isSunset && (
              <p className="font-mono text-[0.65rem] text-gray-mid">
                Golden hour starts at {formatTime(sunTimes.goldenHourStart)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Best Sunset Spots ═══ */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h2 className="font-mono font-extrabold text-xl tracking-[-0.02em] text-ink">Best Sunset Spots</h2>
            <p className="text-sm text-gray-mid mt-1">{sunsetPubs.length} west-facing pubs for golden hour pints</p>
          </div>
          {cheapestSunset && (
            <span className="font-mono text-[0.75rem] text-amber font-bold hidden sm:block">
              From ${cheapestSunset.price!.toFixed(2)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayPubs.map((pub) => {
            const hhStatus = getHappyHourStatus(pub.happyHour)
            const distance = userLocation
              ? formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))
              : null

            return (
              <Link
                key={pub.id}
                href={`/pub/${pub.slug}`}
                className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden no-underline group"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mini Map with Sun Shadow Overlay */}
                <div className="relative h-32 w-full">
                  <MiniMap lat={pub.lat} lng={pub.lng} name={pub.name} />
                  {/* Sun shadow overlay */}
                  {!isNighttime && (
                    <div
                      className="absolute inset-0 pointer-events-none z-[400]"
                      style={{ background: sunShadow }}
                    />
                  )}
                  {isNighttime && (
                    <div className="absolute inset-0 pointer-events-none z-[400] bg-ink/15" />
                  )}
                  {/* Price badge on map */}
                  <div className="absolute bottom-1.5 left-1.5 z-[500] border-2 border-ink bg-white rounded-pill px-2.5 py-0.5">
                    <span className="font-mono text-[0.85rem] font-extrabold text-ink">
                      {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                    </span>
                  </div>
                </div>

                {/* Pub info */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate">
                        {pub.name}
                      </p>
                      <p className="font-body text-[0.75rem] text-gray-mid mt-0.5">
                        {pub.suburb}
                        {distance && ` · ${distance}`}
                        {pub.beerType && ` · ${pub.beerType}`}
                      </p>
                    </div>
                    {hhStatus.isActive && (
                      <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 bg-red-pale text-red border-red flex-shrink-0">
                        HH
                      </span>
                    )}
                  </div>
                  {hhStatus.isActive && pub.happyHour && (
                    <span className="font-mono text-[0.65rem] text-red font-semibold mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />
                      {pub.happyHour}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {sunsetPubs.length > 10 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAllPubs(!showAllPubs)}
              className="font-mono text-[0.75rem] font-bold text-ink hover:text-amber transition-colors"
            >
              {showAllPubs ? 'Show less' : `Show all ${sunsetPubs.length} sunset spots`}
            </button>
          </div>
        )}
      </section>

      {/* ═══ Footer Tip ═══ */}
      <section>
        <div className="bg-off-white rounded-card p-4 text-center">
          <p className="font-mono text-[0.75rem] text-gray-mid flex items-center justify-center gap-2">
            {isSunset && (
              <><Sunset className="w-4 h-4 text-amber" /> Quick! Grab a pint and face west</>
            )}
            {isGoldenHour && !isSunset && (
              <><Sun className="w-4 h-4 text-amber" /> Golden hour lighting — your pint has never looked better</>
            )}
            {!isGoldenHour && !isSunset && !isNighttime && (
              <><Beer className="w-4 h-4 text-amber" /> Golden hour starts at {formatTime(sunTimes.goldenHourStart)}. Plan your sesh</>
            )}
            {isNighttime && (
              <><Moon className="w-4 h-4 text-gray-mid" /> The sun will rise again tomorrow. Rest up</>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
