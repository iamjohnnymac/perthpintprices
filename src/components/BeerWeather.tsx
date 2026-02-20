'use client'

import { useState, useEffect, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import InfoTooltip from './InfoTooltip'

interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
}

interface WeatherCondition {
  emoji: string
  label: string
  message: string
  tagline: string
  bgClass: string
  borderClass: string
  filter: (pubs: Pub[]) => Pub[]
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code >= 1 && code <= 3) return '🌤️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌧️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌧️'
  if (code >= 95 && code <= 99) return '⛈️'
  return '🌤️'
}

function getWeatherLabel(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code >= 1 && code <= 3) return 'Partly cloudy'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

function isRainyCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)
}

function getWeatherCondition(weather: WeatherData, avgPrice: number): WeatherCondition {
  const isRainy = isRainyCode(weather.weatherCode)

  if (isRainy) {
    return {
      emoji: '🌧️',
      label: 'Rainy day',
      message: "Rainy day? Cozy up inside with a cold one",
      tagline: `Feels like a $${avgPrice.toFixed(0)} happy hour kind of day`,
      bgClass: 'bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50',
      borderClass: 'border-blue-200',
      filter: (pubs) => pubs.filter(p => p.happyHour).filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  if (weather.temperature >= 30) {
    return {
      emoji: '🔥',
      label: 'Scorcher',
      message: "Scorcher! Head to the beach pubs for a cold one",
      tagline: `Feels like a $${avgPrice.toFixed(0)} icy pint kind of day`,
      bgClass: 'bg-gradient-to-r from-red-50 via-orange-50 to-amber-50',
      borderClass: 'border-red-200',
      filter: (pubs) => pubs.filter(p => p.sunsetSpot).filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  if (weather.temperature >= 22) {
    return {
      emoji: '☀️',
      label: 'Perfect weather',
      message: "Perfect beer garden weather — get outside!",
      tagline: `Feels like a $${avgPrice.toFixed(0)} pint in the sun kind of day`,
      bgClass: 'bg-gradient-to-r from-amber-50/70 via-yellow-50/50 to-amber-50/70',
      borderClass: 'border-amber-200',
      filter: (pubs) => pubs.filter(p => p.sunsetSpot || p.description?.toLowerCase().includes('garden')).filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  if (weather.temperature >= 15) {
    return {
      emoji: '🌤️',
      label: 'Great pub weather',
      message: "Great pub weather — grab a mate and a pint",
      tagline: `Feels like a $${avgPrice.toFixed(0)} easy-going pint kind of day`,
      bgClass: 'bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50',
      borderClass: 'border-stone-200',
      filter: (pubs) => [...pubs].filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  // Cold
  return {
    emoji: '❄️',
    label: 'Chilly',
    message: "Chilly! Warm up with a pint at a cozy pub",
    tagline: `Feels like a $${avgPrice.toFixed(0)} warm-up pint kind of day`,
    bgClass: 'bg-gradient-to-r from-blue-50 via-indigo-50/30 to-blue-50',
    borderClass: 'border-blue-200',
    filter: (pubs) => [...pubs].filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
  }
}

interface BeerWeatherProps {
  pubs: Pub[]
}

export default function BeerWeather({ pubs }: BeerWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-31.9505&longitude=115.8605&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=Australia%2FPerth'
        )
        const data = await res.json()
        setWeather({
          temperature: data.current.temperature_2m,
          weatherCode: data.current.weathercode,
          windSpeed: data.current.windspeed_10m,
          humidity: data.current.relative_humidity_2m,
        })
      } catch {
        setError(true)
      }
    }
    fetchWeather()
  }, [])

  const avgPrice = useMemo(() => {
    if (pubs.length === 0) return 10
    const priced = pubs.filter(p => p.price !== null); return priced.length > 0 ? priced.reduce((sum, p) => sum + p.price!, 0) / priced.length : 10
  }, [pubs])

  const condition = useMemo(() => {
    if (!weather) return null
    return getWeatherCondition(weather, avgPrice)
  }, [weather, avgPrice])

  const recommendedPubs = useMemo(() => {
    if (!condition) return []
    const filtered = condition.filter(pubs)
    return filtered.length > 0 ? filtered.slice(0, 4) : pubs.filter(p => p.price !== null).sort((a, b) => a.price! - b.price!).slice(0, 4)
  }, [condition, pubs])

  const isWindy = weather && weather.windSpeed > 30

  if (error || !weather || !condition) {
    if (error) return null
    // Loading state
    return (
      <Card className="mb-4 border border-stone-200 bg-stone-50">
        <CardContent className="p-4">
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

  return (
    <Card
      className={`mb-4 border cursor-pointer transition-all duration-300 overflow-hidden ${condition.borderClass} ${condition.bgClass}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl leading-none">{getWeatherEmoji(weather.weatherCode)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-800 text-sm flex items-center">BEER WEATHER<InfoTooltip text="Live conditions from Open-Meteo for Perth CBD, updated on each page load. Pub recommendations are ranked by outdoor seating suitability based on temperature, wind, and UV." /></h3>
                {isWindy && (
                  <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px] px-1.5 py-0">
                    💨 Windy!
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500">{condition.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Temperature display */}
            <div className="text-right">
              <div className="text-2xl font-bold text-stone-800 leading-none">
                {Math.round(weather.temperature)}°
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5">{getWeatherLabel(weather.weatherCode)}</div>
            </div>

            {/* Weather pills */}
            <div className="hidden sm:flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/60 text-stone-500 border border-stone-100">
                💨 {weather.windSpeed.toFixed(0)} km/h
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/60 text-stone-500 border border-stone-100">
                💧 {weather.humidity}%
              </span>
            </div>

            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-stone-200/60">
            {/* Tagline */}
            <p className="text-sm text-stone-600 italic mb-3 text-center">{condition.tagline}</p>

            {/* Mobile weather pills */}
            <div className="flex sm:hidden justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 text-stone-500 border border-stone-100">
                💨 {weather.windSpeed.toFixed(0)} km/h
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 text-stone-500 border border-stone-100">
                💧 {weather.humidity}%
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/60 text-stone-500 border border-stone-100">
                🌡️ {weather.temperature.toFixed(1)}°C
              </span>
            </div>

            {/* Recommended Pubs */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-stone-700">
                🍺 Recommended Right Now
              </h4>
              <span className="text-xs text-stone-400">
                {condition.label} picks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendedPubs.map((pub, index) => (
                <div
                  key={pub.id}
                  className="flex items-center gap-3 rounded-xl bg-white/70 hover:bg-white/95 transition-all duration-200 p-3 border border-stone-100 shadow-sm hover:shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-800 truncate">{pub.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone-400">{pub.suburb}</span>
                      <span className="text-[10px] text-stone-300">·</span>
                      <span className="text-[10px] text-stone-400">{pub.beerType}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                    {pub.happyHour && (
                      <p className="text-[9px] text-emerald-600 font-medium">Happy Hour</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Fun footer */}
            <div className="mt-3 text-center text-xs py-2 rounded-lg bg-white/40 text-stone-400">
              {weather.temperature >= 35 && '🥵 Stay hydrated — water between pints!'}
              {weather.temperature >= 30 && weather.temperature < 35 && '🏖️ Perfect day for a cold schooner by the water'}
              {weather.temperature >= 22 && weather.temperature < 30 && '🌿 Beer garden season is in full swing'}
              {weather.temperature >= 15 && weather.temperature < 22 && '🍂 Classic pub weather — enjoy!'}
              {weather.temperature < 15 && '🧣 Bundle up and find a warm corner booth'}
              {isWindy && ' · Hold onto your hat out there!'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
