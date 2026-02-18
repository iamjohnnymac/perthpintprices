'use client'

import { useState, useEffect, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

export default function SunsetSippers({ pubs }: SunsetSippersProps) {
  const [now, setNow] = useState(new Date())
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000) // Update every 30s
    return () => clearInterval(timer)
  }, [])

  const sunTimes = useMemo(() => getSunTimes(now), [now.toDateString()])
  const sunPosition = getSunPosition(now, sunTimes.sunrise, sunTimes.sunset)

  const sunsetPubs = useMemo(() =>
    pubs.filter(p => p.sunsetSpot).sort((a, b) => a.price - b.price),
    [pubs]
  )

  const isGoldenHour = now >= sunTimes.goldenHourStart && now <= sunTimes.sunset
  const isSunset = now >= new Date(sunTimes.sunset.getTime() - 15 * 60000) && now <= new Date(sunTimes.sunset.getTime() + 30 * 60000)
  const isNighttime = now > sunTimes.sunset || now < sunTimes.sunrise
  const cheapestSunset = sunsetPubs[0]

  // Sun arc SVG dimensions
  const arcWidth = 280
  const arcHeight = 80
  const arcCenterX = arcWidth / 2
  const arcCenterY = arcHeight - 5

  // Calculate sun position on arc
  const sunAngle = Math.PI - (sunPosition / 100) * Math.PI // PI to 0 (left to right)
  const arcRadius = 120
  const sunX = arcCenterX + arcRadius * Math.cos(sunAngle)
  const sunY = arcCenterY - arcRadius * Math.sin(sunAngle)

  // Status message
  let statusMessage = ''
  let statusEmoji = '☀️'
  if (isSunset) {
    statusMessage = 'Sunset is happening RIGHT NOW!'
    statusEmoji = '🌅'
  } else if (isGoldenHour) {
    statusMessage = `Golden hour! Sunset in ${getTimeUntil(sunTimes.sunset, now)}`
    statusEmoji = '🌇'
  } else if (isNighttime) {
    statusMessage = 'After dark — plan tomorrow\'s sunset sesh'
    statusEmoji = '🌙'
  } else {
    statusMessage = `Sunset in ${getTimeUntil(sunTimes.sunset, now)}`
    statusEmoji = '☀️'
  }

  return (
    <Card
      className={`mb-4 border cursor-pointer transition-all duration-300 overflow-hidden ${
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusEmoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-800 text-sm">Sunset Sippers</h3>
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
          <div className="flex items-center gap-3">
            {!isNighttime && (
              <svg width={140} height={45} viewBox={`0 0 ${arcWidth} ${arcHeight}`} className="opacity-80">
                {/* Horizon line */}
                <line x1="10" y1={arcCenterY} x2={arcWidth - 10} y2={arcCenterY} stroke="#d4a574" strokeWidth="1.5" strokeDasharray="4,3" />
                {/* Sun arc path */}
                <path
                  d={`M 20 ${arcCenterY} A ${arcRadius} ${arcRadius} 0 0 1 ${arcWidth - 20} ${arcCenterY}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.4"
                />
                {/* Traveled path */}
                {sunPosition > 0 && sunPosition < 100 && (
                  <path
                    d={`M 20 ${arcCenterY} A ${arcRadius} ${arcRadius} 0 0 1 ${sunX} ${sunY}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                )}
                {/* Sun glow */}
                {sunPosition > 0 && sunPosition < 100 && (
                  <>
                    <circle cx={sunX} cy={sunY} r="12" fill="#fbbf24" opacity="0.2" />
                    <circle cx={sunX} cy={sunY} r="7" fill="#f59e0b" opacity="0.5" />
                    <circle cx={sunX} cy={sunY} r="4" fill="#f59e0b" />
                  </>
                )}
                {/* Labels */}
                <text x="5" y={arcCenterY - 6} fontSize="9" fill="#92734a" fontFamily="monospace">↑{formatTime(sunTimes.sunrise).replace(' ', '')}</text>
                <text x={arcWidth - 75} y={arcCenterY - 6} fontSize="9" fill="#c2410c" fontFamily="monospace">↓{formatTime(sunTimes.sunset).replace(' ', '')}</text>
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
                🍺 Best Sunset Spots ({sunsetPubs.length} pubs)
              </h4>
              {cheapestSunset && (
                <span className="text-xs text-emerald-600 font-medium">
                  Cheapest: ${cheapestSunset.price.toFixed(2)} at {cheapestSunset.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sunsetPubs.slice(0, isExpanded ? 12 : 6).map((pub) => (
                <div
                  key={pub.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-white/90 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                    🌅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">{pub.name}</p>
                    <p className="text-[10px] text-stone-400">{pub.suburb}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700">${pub.price.toFixed(2)}</span>
                    <p className="text-[10px] text-stone-400 truncate max-w-[60px]">{pub.beerType}</p>
                  </div>
                </div>
              ))}
            </div>

            {sunsetPubs.length > 12 && (
              <p className="text-xs text-center text-stone-400 mt-2">
                + {sunsetPubs.length - 12} more sunset spots
              </p>
            )}

            {/* Fun footer */}
            <div className={`mt-3 text-center text-xs py-2 rounded-lg ${
              isGoldenHour || isSunset
                ? 'bg-amber-100/60 text-amber-800'
                : isNighttime
                ? 'bg-indigo-100/60 text-indigo-700'
                : 'bg-amber-50 text-stone-500'
            }`}>
              {isSunset && '🌅 Quick! Grab a pint and face west!'}
              {isGoldenHour && !isSunset && '📸 Golden hour lighting — your pint has never looked better'}
              {!isGoldenHour && !isSunset && !isNighttime && `☀️ Golden hour starts at ${formatTime(sunTimes.goldenHourStart)} — plan your sesh`}
              {isNighttime && '🌙 The sun will rise again tomorrow — rest up, champion'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
