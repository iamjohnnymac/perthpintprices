'use client'

import Link from 'next/link'

import { useState, useEffect, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { Umbrella, Thermometer, Sun, Leaf, Wind } from 'lucide-react'
import LucideIcon from '@/components/LucideIcon'

interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
}

interface WeatherCondition {
  icon: string
  label: string
  message: string
  tagline: string
  filter: (pubs: Pub[]) => Pub[]
}

function getWeatherIcon(code: number): string {
  if (code === 0) return 'sun'
  if (code >= 1 && code <= 3) return 'cloud-sun'
  if (code >= 45 && code <= 48) return 'cloud'
  if (code >= 51 && code <= 57) return 'cloud-rain'
  if (code >= 61 && code <= 67) return 'cloud-rain'
  if (code >= 71 && code <= 77) return 'snowflake'
  if (code >= 80 && code <= 82) return 'cloud-rain'
  if (code >= 95 && code <= 99) return 'cloud-lightning'
  return 'cloud-sun'
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
      icon: 'cloud-rain',
      label: 'Rainy day',
      message: "Rainy day? Cozy up inside with a cold one",
      tagline: `${weather.temperature.toFixed(0)}° and wet. Perfect happy hour weather`,
      filter: (pubs) => pubs.filter(p => p.happyHour).filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  if (weather.temperature >= 30) {
    return {
      icon: 'flame',
      label: 'Scorcher',
      message: "Scorcher! Head to the beach pubs for a cold one",
      tagline: `${weather.temperature.toFixed(0)}° scorcher. Just point me to the coldest pint`,
      filter: (pubs) => pubs.filter(p => p.sunsetSpot).filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  if (weather.temperature >= 22) {
    return {
      icon: 'sun',
      label: 'Perfect weather',
      message: "Mint conditions. Get outside and grab a pint!",
      tagline: `${weather.temperature.toFixed(0)}° and sunny. Get outside and grab a cold one`,
      filter: (pubs) => pubs.filter(p => p.sunsetSpot || p.description?.toLowerCase().includes('garden')).filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  if (weather.temperature >= 15) {
    return {
      icon: 'cloud-sun',
      label: 'Great pub weather',
      message: "Great pub weather. Grab a mate and a pint",
      tagline: `${weather.temperature.toFixed(0)}° with a breeze. Grab a mate and a cold one`,
      filter: (pubs) => [...pubs].filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
    }
  }

  // Cold
  return {
    icon: 'snowflake',
    label: 'Chilly',
    message: "Chilly! Warm up with a pint at a cozy pub",
    tagline: `${weather.temperature.toFixed(0)}° and chilly. Rug up and find a cozy corner`,
    filter: (pubs) => [...pubs].filter(p => p.price !== null).sort((a, b) => a.price! - b.price!),
  }
}

interface BeerWeatherProps {
  pubs: Pub[]
  userLocation?: { lat: number; lng: number } | null
}

export default function BeerWeather({ pubs, userLocation }: BeerWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Fetch from our BOM proxy API (Bureau of Meteorology data)
        const res = await fetch('/api/weather')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setWeather({
          temperature: data.temperature,
          weatherCode: data.weatherCode,
          windSpeed: data.windSpeed,
          humidity: data.humidity,
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
    let filtered = condition.filter(pubs)
    if (filtered.length === 0) {
      filtered = pubs.filter(p => p.price !== null).sort((a, b) => a.price! - b.price!)
    }
    if (userLocation) {
      filtered = [...filtered].sort((a, b) =>
        getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    }
    return filtered.slice(0, 10)
  }, [condition, pubs, userLocation])

  const isWindy = weather && weather.windSpeed > 30

  if (error || !weather || !condition) {
    if (error) return (
      <div className="border-3 border-ink rounded-card bg-white p-6 text-center">
        <p className="text-gray-mid text-sm">Weather data unavailable right now.</p>
        <button onClick={() => window.location.reload()} className="text-amber underline mt-2 text-sm">Retry</button>
      </div>
    )
    // Loading state
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
              <LucideIcon name={getWeatherIcon(weather.weatherCode)} className="w-5 h-5 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">Beer Weather</h3>
                {isWindy && (
                  <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 border-gray-light bg-off-white text-gray-mid flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Windy
                  </span>
                )}
              </div>
              <p className="font-body text-[0.75rem] text-gray-mid">{condition.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Temperature display */}
            <div className="text-right">
              <div className="font-mono text-2xl font-extrabold text-ink leading-none">
                {Math.round(weather.temperature)}°
              </div>
              <div className="font-mono text-[0.6rem] text-gray-mid mt-0.5">{getWeatherLabel(weather.weatherCode)}</div>
            </div>

            {/* Weather pills */}
            <div className="hidden sm:flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[0.6rem] font-mono font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                {weather.windSpeed.toFixed(0)} km/h
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[0.6rem] font-mono font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                {weather.humidity}%
              </span>
            </div>

            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-light">
            {/* Tagline */}
            <p className="font-body text-[0.75rem] text-gray-mid italic mb-3 text-center">{condition.tagline}</p>

            {/* Mobile weather pills */}
            <div className="flex sm:hidden justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill font-mono text-[0.65rem] font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                {weather.windSpeed.toFixed(0)} km/h
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill font-mono text-[0.65rem] font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                {weather.humidity}%
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill font-mono text-[0.65rem] font-bold bg-off-white text-gray-mid border-2 border-gray-light">
                <Thermometer className="w-3.5 h-3.5" /> {weather.temperature.toFixed(1)}°C
              </span>
            </div>

            {/* Recommended Pubs */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink">
                Recommended Right Now
              </h4>
              <span className="font-mono text-[0.65rem] text-gray-mid">
                {condition.label} picks
              </span>
            </div>

            <div className="space-y-0">
              {recommendedPubs.map((pub, index) => (
                <Link
                  key={pub.id} href={`/pub/${pub.slug}`}
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
                      {pub.beerType && ` · ${pub.beerType}`}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-[1rem] font-extrabold text-ink">{pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</span>
                    {pub.happyHour && (
                      <p className="font-mono text-[0.55rem] font-bold text-red">Happy Hour</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Fun footer */}
            <div className="mt-3 bg-off-white rounded-card p-3 text-center">
              <p className="font-mono text-[0.75rem] text-gray-mid flex items-center justify-center gap-2">
                {weather.temperature >= 35 && <><Sun className="w-4 h-4 text-amber" /> Stay hydrated. Water between pints!</>}
                {weather.temperature >= 30 && weather.temperature < 35 && <><Umbrella className="w-4 h-4 text-amber" /> Perfect day for a cold schooner by the water</>}
                {weather.temperature >= 22 && weather.temperature < 30 && <><Leaf className="w-4 h-4 text-amber" /> Perth summer sesh weather. Get amongst it</>}
                {weather.temperature >= 15 && weather.temperature < 22 && <><Leaf className="w-4 h-4 text-amber" /> Classic pub weather</>}
                {weather.temperature < 15 && <><Thermometer className="w-4 h-4 text-gray-mid" /> Bundle up and find a warm corner booth</>}
                {isWindy && ' · Hold onto your hat out there!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
