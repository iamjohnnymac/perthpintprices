import { createClient } from '@supabase/supabase-js'
import { Pub } from '@/types/pub'
import { getHappyHourStatus } from '@/lib/happyHourLive'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type CrowdLevel = 1 | 2 | 3 | 4

export interface CrowdReport {
  pub_id: string
  crowd_level: CrowdLevel
  report_count: number
  latest_report: string
  minutes_ago: number
}

export const CROWD_LEVELS = {
  1: { label: 'Empty', emoji: '😴', color: 'bg-blue-500' },
  2: { label: 'Moderate', emoji: '👥', color: 'bg-green-500' },
  3: { label: 'Busy', emoji: '◉', color: 'bg-yellow-500' },
  4: { label: 'Packed', emoji: '🔥', color: 'bg-red-500' },
} as const

export async function getCrowdLevels(): Promise<Record<string, CrowdReport>> {
  const { data, error } = await supabase.rpc('get_live_crowd_levels')
  
  if (error) {
    console.error('Error fetching crowd levels:', error)
    return {}
  }
  
  const crowdMap: Record<string, CrowdReport> = {}
  for (const report of data || []) {
    crowdMap[report.pub_id] = report
  }
  return crowdMap
}

export async function reportCrowdLevel(pubId: string, level: CrowdLevel): Promise<boolean> {
  const { error } = await supabase
    .from('crowd_reports')
    .insert({
      pub_id: pubId,
      crowd_level: level,
    })
  
  if (error) {
    console.error('Error reporting crowd level:', error)
    return false
  }
  return true
}

/**
 * Generate a human-readable happy hour text from structured data
 * Returns format compatible with existing happyHour.ts parser: "Daily 4-7pm" or "Mon-Fri 5-7pm"
 */
function generateHappyHourText(days: string | null, start: string | null, end: string | null): string | null {
  if (!days || !start || !end) return null
  
  const startH = parseInt(start.split(':')[0])
  const endH = parseInt(end.split(':')[0])
  
  const fmtHour = (h: number): string => {
    if (h === 0) return '12'
    if (h > 12) return String(h - 12)
    return String(h)
  }
  
  const period = endH >= 12 ? 'pm' : 'am'
  
  // Map day strings to parser-compatible format
  const d = days.toLowerCase().trim()
  let dayLabel = days
  if (d === '7 days' || d === 'daily' || d === 'everyday') {
    dayLabel = 'Daily'
  } else if (d.match(/^(mon|tue|wed|thu|fri|sat|sun)/i) && d.includes('-')) {
    // Already in "Mon-Fri" format, capitalize first letters
    const parts = d.split('-')
    dayLabel = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1, 3)).join('-')
  }
  
  return `${dayLabel} ${fmtHour(startH)}-${fmtHour(endH)}${period}`
}

// Fetch pubs from Supabase with dynamic happy hour pricing
export async function getPubs(): Promise<Pub[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .order('price', { ascending: true, nullsFirst: false })
  
  if (error) {
    console.error('Error fetching pubs:', error)
    return []
  }
  
  return (data || []).map(row => {
    const regularPrice = row.price != null ? Number(row.price) : null
    const hhPrice = row.happy_hour_price != null ? Number(row.happy_hour_price) : null
    
    // Compute live happy hour status
    const hhStatus = getHappyHourStatus({
      price: regularPrice,
      happyHourPrice: hhPrice,
      happyHourDays: row.happy_hour_days || null,
      happyHourStart: row.happy_hour_start || null,
      happyHourEnd: row.happy_hour_end || null,
    })
    
    // Generate happyHour text from structured data if not already set
    const happyHourText = row.happy_hour || 
      generateHappyHourText(row.happy_hour_days, row.happy_hour_start, row.happy_hour_end)
    
    return {
      slug: row.slug || '',
      id: row.id,
      name: row.name,
      suburb: row.suburb,
      // KEY: price = effective price (switches to HH price when active)
      price: hhStatus.effectivePrice,
      regularPrice: regularPrice,
      imageUrl: row.image_url ?? null,
      address: row.address || '',
      website: row.website || null,
      lat: row.lat || 0,
      lng: row.lng || 0,
      beerType: row.beer_type || '',
      happyHour: happyHourText,
      description: row.description || null,
      lastUpdated: row.last_updated || undefined,
      sunsetSpot: row.sunset_spot || false,
      priceVerified: row.price_verified !== false,
      hasTab: row.has_tab === true,
      kidFriendly: row.kid_friendly === true,
      // Happy hour detail fields
      happyHourPrice: hhPrice,
      happyHourDays: row.happy_hour_days || null,
      happyHourStart: row.happy_hour_start || null,
      happyHourEnd: row.happy_hour_end || null,
      lastVerified: row.last_verified || null,
      // Computed live status
      isHappyHourNow: hhStatus.isActive,
      happyHourLabel: hhStatus.happyHourLabel,
      happyHourMinutesRemaining: hhStatus.minutesRemaining,
    }
  })
}

// Fetch a single pub by slug
export async function getPubBySlug(slug: string): Promise<Pub | null> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error || !data) {
    console.error('Error fetching pub:', error)
    return null
  }
  
  const row = data
  const regularPrice = row.price != null ? Number(row.price) : null
  const hhPrice = row.happy_hour_price != null ? Number(row.happy_hour_price) : null
  
  const hhStatus = getHappyHourStatus({
    price: regularPrice,
    happyHourPrice: hhPrice,
    happyHourDays: row.happy_hour_days || null,
    happyHourStart: row.happy_hour_start || null,
    happyHourEnd: row.happy_hour_end || null,
  })
  
  const happyHourText = row.happy_hour || 
    generateHappyHourText(row.happy_hour_days, row.happy_hour_start, row.happy_hour_end)
  
  return {
    id: row.id,
    slug: row.slug || '',
    name: row.name,
    suburb: row.suburb,
    price: hhStatus.effectivePrice,
    regularPrice: regularPrice,
      imageUrl: row.image_url ?? null,
    address: row.address || '',
    website: row.website || null,
    lat: row.lat || 0,
    lng: row.lng || 0,
    beerType: row.beer_type || '',
    happyHour: happyHourText,
    description: row.description || null,
    lastUpdated: row.last_updated || undefined,
    sunsetSpot: row.sunset_spot || false,
    priceVerified: row.price_verified !== false,
    hasTab: row.has_tab === true,
    kidFriendly: row.kid_friendly === true,
    happyHourPrice: hhPrice,
    happyHourDays: row.happy_hour_days || null,
    happyHourStart: row.happy_hour_start || null,
    happyHourEnd: row.happy_hour_end || null,
    lastVerified: row.last_verified || null,
    isHappyHourNow: hhStatus.isActive,
    happyHourLabel: hhStatus.happyHourLabel,
    happyHourMinutesRemaining: hhStatus.minutesRemaining,
  }
}

// Fetch all pub slugs (for generateStaticParams)
export async function getAllPubSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('slug')
    .order('slug')
  
  if (error || !data) return []
  return data.map(row => row.slug).filter(Boolean)
}

// Fetch nearby pubs (same suburb, excluding current)
export async function getNearbyPubs(suburb: string, excludeId: number, limit: number = 4): Promise<Pub[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .eq('suburb', suburb)
    .neq('id', excludeId)
    .order('price', { ascending: true, nullsFirst: false })
    .limit(limit)
  
  if (error || !data) return []
  
  return data.map(row => {
    const regularPrice = row.price != null ? Number(row.price) : null
    const hhPrice = row.happy_hour_price != null ? Number(row.happy_hour_price) : null
    const hhStatus = getHappyHourStatus({
      price: regularPrice,
      happyHourPrice: hhPrice,
      happyHourDays: row.happy_hour_days || null,
      happyHourStart: row.happy_hour_start || null,
      happyHourEnd: row.happy_hour_end || null,
    })
    const happyHourText = row.happy_hour || generateHappyHourText(row.happy_hour_days, row.happy_hour_start, row.happy_hour_end)
    
    return {
      id: row.id,
      slug: row.slug || '',
      name: row.name,
      suburb: row.suburb,
      price: hhStatus.effectivePrice,
      regularPrice: regularPrice,
      imageUrl: row.image_url ?? null,
      address: row.address || '',
      website: row.website || null,
      lat: row.lat || 0,
      lng: row.lng || 0,
      beerType: row.beer_type || '',
      happyHour: happyHourText,
      description: row.description || null,
      lastUpdated: row.last_updated || undefined,
      sunsetSpot: row.sunset_spot || false,
      priceVerified: row.price_verified !== false,
      hasTab: row.has_tab === true,
      kidFriendly: row.kid_friendly === true,
      happyHourPrice: hhPrice,
      happyHourDays: row.happy_hour_days || null,
      happyHourStart: row.happy_hour_start || null,
      happyHourEnd: row.happy_hour_end || null,
      lastVerified: row.last_verified || null,
      isHappyHourNow: hhStatus.isActive,
      happyHourLabel: hhStatus.happyHourLabel,
      happyHourMinutesRemaining: hhStatus.minutesRemaining,
    }
  })
}
