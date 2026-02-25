'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import InfoTooltip from './InfoTooltip'
import { getDistanceKm, formatDistance } from '@/lib/location'

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
  "Perfect excuse for a cheeky pint by the window ☕",
  "Nothing beats rain on the roof and a cold one in hand 🍺",
  "Chucking it down — time to hunker down with a brew 🌧️",
  "Wet outside, warm inside — that's the Perth way 🤙",
]

const DRY_QUIPS = [
  "No rain, no worries — still great spots to chill ☀️",
  "Save these for the next downpour — or just go now 🍻",
  "Cozy vibes rain or shine ✌️",
]

export default function RainyDay({ pubs, userLocation }: RainyDayProps) {
  const [weather, setWeather] = useState<RainWeather | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
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

    return filtered.slice(0, 4)
  }, [pubs, userLocation])

  const quip = useMemo(() => {
    const quips = isRaining ? RAIN_QUIPS : DRY_QUIPS
    return quips[Math.floor(Math.random() * quips.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRaining])

  if (error || !weather) {
    if (error) return null
    return (
      <Card className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-stone-200/40">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-stone-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-48 bg-stone-100 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cozyPubs.length === 0) return null

  return (
    <Card
      className={`rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-stone-200/40 cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.995] overflow-hidden ${
        isRaining
          ? 'bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50'
          : 'bg-white'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl leading-none">{isRaining ? '☔' : '☕'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-heading text-stone-800 flex items-center">
                  {isRaining ? 'RAINY DAY PUBS' : 'COZY CORNERS'}
                  <InfoTooltip text="Live rain data from Open-Meteo for Perth CBD. When it rains, we highlight cozy pubs perfect for hunkering down with a pint." />
                </h3>
                {isRaining && weather.rain > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                    {weather.rain.toFixed(1)} mm/h
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500">
                {isRaining
                  ? "It's chucking it down — here's where to hide"
                  : "No rain today, but these are still top spots to hunker down"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRaining && (
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-blue-700 leading-none">
                  {getRainIntensity(weather.weatherCode)}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">{Math.round(weather.temperature)}°C</div>
              </div>
            )}

            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-stone-200/60">
            {/* Rain stats for mobile */}
            {isRaining && (
              <div className="flex sm:hidden justify-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                  🌧️ {getRainIntensity(weather.weatherCode)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 text-stone-500 border border-stone-100">
                  💧 {weather.precipitation.toFixed(1)} mm
                </span>
              </div>
            )}

            {/* Tagline */}
            <p className="text-xs text-stone-500 italic mb-2 text-center">
              {isRaining
                ? "Chucking it down out there — duck into one of these cozy spots"
                : "No umbrella needed, but these cozy corners are always a good shout"}
            </p>

            {/* Recommended Pubs */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-stone-700">
                ▸ {isRaining ? 'Duck In Here' : 'Cozy Picks'}
              </h4>
              <span className="text-xs text-stone-400">
                {cozyPubs.length} cozy {cozyPubs.length === 1 ? 'spot' : 'spots'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cozyPubs.map((pub, index) => (
                <Link
                  key={pub.id}
                  href={`/pub/${pub.slug}`}
                  className="flex items-center gap-3 rounded-xl bg-white/70 hover:bg-white/95 transition-all duration-200 p-3 border border-stone-100 shadow-sm hover:shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isRaining ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'} font-bold text-sm flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone-400">
                        {pub.suburb}
                        {userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}
                      </span>
                      {pub.vibeTag && (
                        <>
                          <span className="text-[10px] text-stone-300">·</span>
                          <span className="text-[10px] text-stone-400">{pub.vibeTag}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">
                      {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                    </span>
                    {pub.happyHour && (
                      <p className="text-[9px] text-emerald-600 font-medium">Happy Hour</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Fun footer */}
            <div className="mt-3 text-center text-xs py-2 rounded-lg bg-white/40 text-stone-400">
              {quip}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
