'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { CloudRain, Coffee, Droplets } from 'lucide-react'

interface RainyDayProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

interface RainWeather {
  weatherCode: number
  rain: number
  precipitation: number
  temperature: number
}

function isRainingCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)
}

function getRainIntensity(code: number): string {
  if (code >= 51 && code <= 53) return 'Light drizzle'
  if (code >= 55 && code <= 57) return 'Heavy drizzle'
  if (code >= 61 && code <= 63) return 'Light rain'
  if (code >= 65 && code <= 67) return 'Heavy rain'
  if (code === 80) return 'Light showers'
  if (code >= 81 && code <= 82) return 'Heavy showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Rain'
}

const RAIN_QUIPS = [
  "Perfect excuse for a cheeky pint by the window",
  "Nothing beats rain on the roof and a cold one in hand",
  "Chucking it down. Time to hunker down with a brew",
  "Wet outside, warm inside. That's the Perth way",
]

const DRY_QUIPS = [
  "No rain, no worries. Still great spots to chill",
  "Save these for the next downpour, or just go now",
  "Cozy vibes rain or shine",
]

export default function RainyDay({ pubs, userLocation }: RainyDayProps) {
  const [weather, setWeather] = useState<RainWeather | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-31.9505&longitude=115.8605&current=temperature_2m,weathercode,rain,precipitation&timezone=Australia%2FPerth'
        )
        const data = await res.json()
        setWeather({
          weatherCode: data.current.weathercode,
          rain: data.current.rain,
          precipitation: data.current.precipitation,
          temperature: data.current.temperature_2m,
        })
      } catch {
        setError(true)
      }
    }
    fetchWeather()
  }, [])

  const isRaining = weather ? isRainingCode(weather.weatherCode) : false

  const cozyPubs = useMemo(() => {
    let filtered = pubs.filter(p => p.cozyPub === true)

    if (filtered.length === 0) return []

    if (userLocation) {
      filtered = [...filtered].sort((a, b) => {
        const distA = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng)
        const distB = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        return distA - distB
      })
    } else {
      filtered = [...filtered].sort((a, b) => {
        const priceA = a.price ?? 999
        const priceB = b.price ?? 999
        return priceA - priceB
      })
    }

    return filtered.slice(0, 10)
  }, [pubs, userLocation])

  const quip = useMemo(() => {
    const quips = isRaining ? RAIN_QUIPS : DRY_QUIPS
    return quips[Math.floor(Math.random() * quips.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRaining])

  if (error || !weather) {
    if (error) return null
    return (
      <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-off-white animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-off-white rounded-card animate-pulse mb-1" />
              <div className="h-3 w-48 bg-off-white rounded-card animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cozyPubs.length === 0) return null

  return (
    <div
      className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden cursor-pointer transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
              {isRaining ? <CloudRain className="w-5 h-5 text-ink" /> : <Coffee className="w-5 h-5 text-ink" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">
                  {isRaining ? 'Rainy Day Pubs' : 'Cozy Corners'}
                </h3>
                {isRaining && weather.rain > 0 && (
                  <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 border-gray-light bg-off-white text-gray-mid">
                    {weather.rain.toFixed(1)} mm/h
                  </span>
                )}
              </div>
              <p className="font-body text-[0.75rem] text-gray-mid">
                {isRaining
                  ? "It's chucking it down. Here's where to hide"
                  : "No rain today, but these are still top spots to hunker down"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRaining && (
              <div className="text-right hidden sm:block">
                <div className="font-mono text-sm font-bold text-ink leading-none">
                  {getRainIntensity(weather.weatherCode)}
                </div>
                <div className="font-mono text-[0.6rem] text-gray-mid mt-0.5">{Math.round(weather.temperature)}°C</div>
              </div>
            )}

            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-light">
            {/* Rain stats for mobile */}
            {isRaining && (
              <div className="flex sm:hidden justify-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill font-mono text-[0.65rem] font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                  <CloudRain className="w-3.5 h-3.5" /> {getRainIntensity(weather.weatherCode)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill font-mono text-[0.65rem] font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                  <Droplets className="w-3.5 h-3.5" /> {weather.precipitation.toFixed(1)} mm
                </span>
              </div>
            )}

            {/* Tagline */}
            <p className="font-body text-[0.75rem] text-gray-mid italic mb-3 text-center">
              {isRaining
                ? "Chucking it down out there. Duck into one of these cozy spots"
                : "No umbrella needed, but these cozy corners are always a good shout"}
            </p>

            {/* Recommended Pubs */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink">
                {isRaining ? 'Duck In Here' : 'Cozy Picks'}
              </h4>
              <span className="font-mono text-[0.65rem] text-gray-mid">
                {cozyPubs.length} cozy {cozyPubs.length === 1 ? 'spot' : 'spots'}
              </span>
            </div>

            <div className="space-y-0">
              {cozyPubs.map((pub, index) => (
                <Link
                  key={pub.id}
                  href={`/pub/${pub.slug}`}
                  className={`flex items-center gap-3 px-3 py-3 no-underline group ${
                    index > 0 ? 'border-t border-gray-light' : ''
                  } ${index === 0 ? 'bg-amber/5' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`font-mono text-[0.65rem] font-bold w-5 flex-shrink-0 ${index === 0 ? 'text-amber' : 'text-gray-mid'}`}>
                    {index === 0 ? '\u2605' : `${index + 1}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                    <span className="font-body text-[0.75rem] text-gray-mid">
                      {pub.suburb}
                      {userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}
                      {pub.vibeTag && ` · ${pub.vibeTag}`}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-[1rem] font-extrabold text-ink">
                      {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                    </span>
                    {pub.happyHour && (
                      <p className="font-mono text-[0.55rem] font-bold text-red">Happy Hour</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Fun footer */}
            <div className="mt-3 bg-off-white rounded-card p-3 text-center">
              <p className="font-mono text-[0.75rem] text-gray-mid">
                {quip}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
