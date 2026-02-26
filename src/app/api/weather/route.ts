import { NextResponse } from 'next/server'

// Force dynamic so Vercel doesn't pre-render this at build time
export const dynamic = 'force-dynamic'

// BOM Perth Metro station (094608) - same readings as bom.gov.au
const BOM_URL = 'https://www.bom.gov.au/fwo/IDW60901/IDW60901.94608.json'

// Cache for 15 minutes to be respectful to BOM servers
let cachedData: { data: BOMWeather; timestamp: number } | null = null
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

interface BOMObservation {
  air_temp: number
  weather: string
  wind_spd_kmh: number
  rel_hum: number
  cloud: string
  cloud_oktas: number
  gust_kmh: number
  rain_trace: string
  local_date_time_full: string
}

interface BOMWeather {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  description: string
  source: 'bom'
}

// Map BOM text weather descriptions to WMO weather codes
// so our existing BeerWeather logic works unchanged
function bomWeatherToCode(obs: BOMObservation): number {
  const weather = (obs.weather || '').toLowerCase()
  const cloud = (obs.cloud || '').toLowerCase()
  const oktas = obs.cloud_oktas ?? 0

  // Rain/storm conditions
  if (weather.includes('thunder') || weather.includes('storm')) return 95
  if (weather.includes('heavy rain') || weather.includes('heavy shower')) return 65
  if (weather.includes('rain') || weather.includes('shower') || weather.includes('precip') || weather.includes('drizzle')) return 61
  
  // Cloud conditions (use oktas for accuracy)
  if (oktas === 0 || cloud.includes('clear')) return 0
  if (oktas <= 2 || cloud.includes('few')) return 1
  if (oktas <= 5 || cloud.includes('partly') || cloud.includes('scattered')) return 2
  if (oktas <= 7 || cloud.includes('mostly') || cloud.includes('broken')) return 3
  if (oktas === 8 || cloud.includes('overcast')) return 3
  
  // Fog
  if (weather.includes('fog') || weather.includes('mist')) return 45
  
  return 2 // Default: partly cloudy
}

export async function GET() {
  try {
    // Return cached data if fresh enough
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data, {
        headers: { 'Cache-Control': 'public, max-age=900, s-maxage=900' }
      })
    }

    const res = await fetch(BOM_URL, {
      headers: { 'User-Agent': 'Arvo/1.0 (perthpintprices.com)' },
      next: { revalidate: 900 } // ISR cache 15 min
    })

    if (!res.ok) throw new Error(`BOM API returned ${res.status}`)

    const json = await res.json()
    const obs: BOMObservation = json.observations?.data?.[0]

    if (!obs) throw new Error('No observation data')

    const weather: BOMWeather = {
      temperature: obs.air_temp,
      weatherCode: bomWeatherToCode(obs),
      windSpeed: obs.wind_spd_kmh,
      humidity: obs.rel_hum,
      description: obs.weather || obs.cloud || 'Unknown',
      source: 'bom'
    }

    // Update cache
    cachedData = { data: weather, timestamp: Date.now() }

    return NextResponse.json(weather, {
      headers: { 'Cache-Control': 'public, max-age=900, s-maxage=900' }
    })
  } catch (error) {
    // Fallback to Open-Meteo if BOM fails
    try {
      const fallback = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-31.9505&longitude=115.8605&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=Australia%2FPerth'
      )
      const data = await fallback.json()
      return NextResponse.json({
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weathercode,
        windSpeed: data.current.windspeed_10m,
        humidity: data.current.relative_humidity_2m,
        description: 'Via Open-Meteo (BOM unavailable)',
        source: 'open-meteo'
      })
    } catch {
      return NextResponse.json(
        { error: 'Weather unavailable' },
        { status: 503 }
      )
    }
  }
}
