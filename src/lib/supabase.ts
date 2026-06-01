import { createClient } from '@supabase/supabase-js'
import { Pub } from '@/types/pub'
import { getHappyHourStatus } from '@/lib/happyHourLive'
import { haversineDistanceKm } from '@/lib/location'
import { hasUsableCoordinates, NEARBY_RADIUS_KM, rankNearbyPubs } from '@/lib/nearbyPubs'
import { getPubIndexability, PubIndexabilityTier } from '@/lib/pubIndexability'
import { normalizePriceConfidence } from '@/lib/priceProvenance'
import { toSuburbSlug } from './urls'

function titleCase(str: string): string {
  if (!str) return str
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

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
  1: { label: 'Empty', emoji: 'moon', color: 'bg-blue' },
  2: { label: 'Moderate', emoji: 'users', color: 'bg-amber' },
  3: { label: 'Busy', emoji: 'circle-dot', color: 'bg-amber-light' },
  4: { label: 'Packed', emoji: 'flame', color: 'bg-red' },
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

// Fetch pubs from Supabase with dynamic happy hour pricing
// Maps a raw `pubs` table row to the app's Pub shape, computing live happy-hour
// status + effective price. Single source of truth for row -> Pub (was previously
// copy-pasted into getPubs / getPubBySlug / getNearbyPubs / getSimilarPricePubs).
function toPub(row: any): Pub {
  const regularPrice = row.price != null ? Number(row.price) : null
  const hhPrice = row.happy_hour_price != null ? Number(row.happy_hour_price) : null

  const hhStatus = getHappyHourStatus({
    price: regularPrice,
    happyHourPrice: hhPrice,
    happyHourDays: row.happy_hour_days || null,
    happyHourStart: row.happy_hour_start || null,
    happyHourEnd: row.happy_hour_end || null,
  })

  const happyHourText = row.happy_hour || hhStatus.happyHourLabel

  return {
    id: row.id,
    slug: row.slug || '',
    name: row.name,
    suburb: row.suburb,
    // price = effective price (switches to the HH price when active)
    price: hhStatus.effectivePrice,
    regularPrice,
    imageUrl: row.image_url ?? null,
    vibeTag: row.vibe_tag || null,
    effectivePrice: (hhStatus.isActive && hhPrice) ? hhPrice : regularPrice,
    address: row.address || '',
    website: row.website || null,
    lat: row.lat || 0,
    lng: row.lng || 0,
    beerType: titleCase(row.beer_type || ''),
    happyHour: happyHourText,
    description: row.description || null,
    source: row.source || undefined,
    priceSource: row.price_source || null,
    priceVerifiedAt: row.price_verified_at || null,
    priceConfidence: normalizePriceConfidence(row.price_confidence),
    lastUpdated: row.last_updated || undefined,
    sunsetSpot: row.sunset_spot || false,
    priceVerified: row.price_verified !== false,
    hasTab: row.has_tab === true,
    kidFriendly: row.kid_friendly === true,
    cozyPub: row.cozy_pub === true,
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

export async function getPubs(): Promise<Pub[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .order('price', { ascending: true, nullsFirst: false })
  
  if (error) {
    console.error('Error fetching pubs:', error)
    return []
  }
  
  return (data || []).map(toPub)
}

// Lightweight pub fetch for homepage — only fields needed for rendering + SSR links
// Reduces HTML payload from ~352KB to ~80KB
export interface PubLite {
  id: number
  name: string
  slug: string
  suburb: string
  price: number | null
  regularPrice: number | null
  effectivePrice: number | null
  priceVerified: boolean
  lat: number
  lng: number
  happyHour: string | null
  happyHourPrice: number | null
  isHappyHourNow: boolean
  happyHourLabel: string | null
  happyHourMinutesRemaining: number | null
  lastVerified: string | null
  vibeTag: string | null
  imageUrl: string | null
}

export async function getPubsLite(): Promise<PubLite[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('id, name, slug, suburb, price, price_verified, lat, lng, happy_hour, happy_hour_price, happy_hour_days, happy_hour_start, happy_hour_end, last_verified, vibe_tag, image_url')
    .order('price', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching pubs lite:', error)
    return []
  }

  return (data || []).map(row => {
    const regularPrice = row.price != null ? Number(row.price) : null
    const hhPrice = row.happy_hour_price != null ? Number(row.happy_hour_price) : null

    const hhStatus = getHappyHourStatus({
      price: regularPrice,
      happyHourPrice: hhPrice,
      happyHourDays: row.happy_hour_days || null,
      happyHourStart: row.happy_hour_start || null,
      happyHourEnd: row.happy_hour_end || null,
    })

    const happyHourText = row.happy_hour || hhStatus.happyHourLabel

    return {
      id: row.id,
      name: row.name,
      slug: row.slug || '',
      suburb: row.suburb,
      price: hhStatus.effectivePrice,
      regularPrice,
      effectivePrice: (hhStatus.isActive && hhPrice) ? hhPrice : regularPrice,
      priceVerified: row.price_verified !== false,
      lat: row.lat || 0,
      lng: row.lng || 0,
      happyHour: happyHourText,
      happyHourPrice: hhPrice,
      isHappyHourNow: hhStatus.isActive,
      happyHourLabel: hhStatus.happyHourLabel,
      happyHourMinutesRemaining: hhStatus.minutesRemaining,
      lastVerified: row.last_verified || null,
      vibeTag: row.vibe_tag || null,
      imageUrl: row.image_url ?? null,
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
  
  return toPub(data)
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

// Fetch all pub slug + suburb pairs (for routing only)
export async function getAllPubSlugPairs(): Promise<{ slug: string; suburb: string }[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('slug, suburb')
    .order('slug')

  if (error || !data) return []
  return data.filter(row => row.slug && row.suburb).map(row => ({ slug: row.slug, suburb: row.suburb }))
}

export interface IndexablePubSlugPair {
  slug: string
  suburb: string
  lastModified: string | null
  dataScore: number
  indexabilityTier: PubIndexabilityTier
}

export interface PubLastModifiedPair {
  suburb: string
  lastModified: string | null
}

export async function getAllPubLastModifiedPairs(): Promise<PubLastModifiedPair[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('suburb, last_verified, last_updated, updated_at')

  if (error || !data) return []

  return data
    .filter(row => row.suburb)
    .map(row => ({
      suburb: row.suburb,
      lastModified: row.last_verified || row.updated_at || row.last_updated || null,
    }))
}

export async function getIndexablePubSlugPairs(): Promise<IndexablePubSlugPair[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('slug, suburb, price, price_verified, last_verified, last_updated, updated_at, happy_hour, happy_hour_price, happy_hour_days, happy_hour_start, happy_hour_end, beer_type, vibe_tag, has_tab, kid_friendly, cozy_pub, sunset_spot, website')
    .order('slug')

  if (error || !data) return []

  return data
    .filter(row => row.slug && row.suburb)
    .map(row => {
      const price = row.price != null ? Number(row.price) : null
      const happyHourPrice = row.happy_hour_price != null ? Number(row.happy_hour_price) : null
      const indexability = getPubIndexability({
        price,
        priceVerified: row.price_verified,
        lastVerified: row.last_verified || null,
        happyHour: row.happy_hour || null,
        happyHourPrice,
        happyHourDays: row.happy_hour_days || null,
        happyHourStart: row.happy_hour_start || null,
        happyHourEnd: row.happy_hour_end || null,
        beerType: row.beer_type || null,
        vibeTag: row.vibe_tag || null,
        hasTab: row.has_tab,
        kidFriendly: row.kid_friendly,
        cozyPub: row.cozy_pub,
        sunsetSpot: row.sunset_spot,
        website: row.website || null,
      })

      return {
        slug: row.slug,
        suburb: row.suburb,
        lastModified: row.last_verified || row.updated_at || row.last_updated || null,
        dataScore: indexability.dataScore,
        indexabilityTier: indexability.tier,
        isIndexable: indexability.isIndexable,
      }
    })
    .filter(row => row.isIndexable)
    .map(({ isIndexable, ...row }) => row)
}

async function getSameSuburbPricedPubs(suburb: string, excludeId: number, limit: number): Promise<Pub[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .eq('suburb', suburb)
    .neq('id', excludeId)
    .not('price', 'is', null)
    .or('price_verified.is.null,price_verified.eq.true')
    .order('price', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(toPub)
}

async function getRadiusCandidatePubs(pub: Pub, radiusKm: number, limit: number): Promise<Pub[]> {
  if (!hasUsableCoordinates(pub)) return []

  const latDelta = radiusKm / 111
  const lngScaleKm = 111 * Math.cos(pub.lat * Math.PI / 180)
  if (!Number.isFinite(lngScaleKm) || lngScaleKm === 0) return []
  const lngDelta = radiusKm / lngScaleKm

  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .neq('id', pub.id)
    .not('price', 'is', null)
    .or('price_verified.is.null,price_verified.eq.true')
    .gte('lat', pub.lat - latDelta)
    .lte('lat', pub.lat + latDelta)
    .gte('lng', pub.lng - lngDelta)
    .lte('lng', pub.lng + lngDelta)
    .order('price', { ascending: true, nullsFirst: false })
    .limit(Math.max(limit * 4, 12))

  if (error || !data) return []

  return data.map(toPub)
}

// Fetch geo-aware nearby pubs, falling back to same-suburb links when sparse.
export async function getNearbyPubs(pub: Pub, limit: number = 4): Promise<Pub[]> {
  const radiusCandidates = await getRadiusCandidatePubs(pub, NEARBY_RADIUS_KM, limit)
  const sameSuburbCandidates = radiusCandidates.length < limit
    ? await getSameSuburbPricedPubs(pub.suburb, pub.id, limit)
    : []

  return rankNearbyPubs(pub, [...radiusCandidates, ...sameSuburbCandidates], limit)
}

export async function getVerifiedPricePubs(): Promise<Pub[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .not('price', 'is', null)
    .or('price_verified.is.null,price_verified.eq.true')
    .order('price', { ascending: true, nullsFirst: false })

  if (error || !data) return []

  return data.map(toPub)
}

export function getNearestPubFromList(pubs: Pub[], lat: number, lng: number): Pub | null {
  if (pubs.length === 0) return null

  const byPrice = (a: Pub, b: Pub) => (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return [...pubs].sort(byPrice)[0] ?? null
  }

  return pubs
    .map(pub => ({
      pub,
      distance: haversineDistanceKm(lat, lng, pub.lat, pub.lng),
    }))
    .sort((a, b) => a.distance - b.distance || byPrice(a.pub, b.pub))[0]?.pub ?? null
}

export async function getLatestAndrewCallAtByPubId(): Promise<Record<number, string>> {
  const { data, error } = await supabase
    .from('phone_call_log')
    .select('pub_id, created_at')
    .not('pub_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error || !data) return {}

  const latestByPubId: Record<number, string> = {}
  for (const row of data) {
    const pubId = Number(row.pub_id)
    if (!Number.isFinite(pubId) || !row.created_at || latestByPubId[pubId]) continue
    latestByPubId[pubId] = row.created_at
  }

  return latestByPubId
}

// Fetch pubs in a similar price range from different suburbs (for cross-linking)
export async function getSimilarPricePubs(price: number, excludeSuburb: string, excludeId: number, limit: number = 6): Promise<Pub[]> {
  const { data, error } = await supabase
    .from('pubs')
    .select('*')
    .neq('suburb', excludeSuburb)
    .neq('id', excludeId)
    .not('price', 'is', null)
    .gte('price', price - 1.0)
    .lte('price', price + 1.0)
    .order('price', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(toPub)
}

// Fetch price history for a pub (for trend charts)
export interface PriceHistoryPoint {
  price: number | null
  happyHourPrice: number | null
  beerType: string | null
  changedAt: string
  changeType: string
  source: string | null
}

export async function getPriceHistory(pubId: number): Promise<PriceHistoryPoint[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('price, happy_hour_price, beer_type, changed_at, change_type, source')
    .eq('pub_id', pubId)
    .order('changed_at', { ascending: true })
  
  if (error || !data) {
    console.error('Error fetching price history:', error)
    return []
  }
  
  return data.map(row => ({
    price: row.price != null ? Number(row.price) : null,
    happyHourPrice: row.happy_hour_price != null ? Number(row.happy_hour_price) : null,
    beerType: row.beer_type || null,
    changedAt: row.changed_at,
    changeType: row.change_type,
    source: row.source || null,
  }))
}

// Dynamic site-wide stats for SEO metadata and components
export async function getSiteStats(): Promise<{
  venueCount: number
  suburbCount: number
  avgPrice: string
  cheapestPrice: string
}> {
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('total_pubs, total_suburbs, avg_price, min_price')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    // Fallback: compute from pubs table directly
    const pubs = await getPubs()
    const priced = pubs.filter(p => p.price !== null)
    const suburbs = new Set(pubs.map(p => p.suburb))
    const avg = priced.length > 0
      ? (priced.reduce((s, p) => s + p.price!, 0) / priced.length).toFixed(2)
      : '0'
    const min = priced.length > 0
      ? Math.min(...priced.map(p => p.price!)).toFixed(2)
      : '0'
    return {
      venueCount: pubs.length,
      suburbCount: suburbs.size,
      avgPrice: avg,
      cheapestPrice: min,
    }
  }

  return {
    venueCount: data.total_pubs,
    suburbCount: data.total_suburbs,
    avgPrice: Number(data.avg_price).toFixed(2),
    cheapestPrice: Number(data.min_price).toFixed(2),
  }
}

// ═══ SUBURB PAGES ═══

export interface SuburbInfo {
  name: string
  slug: string
  pubCount: number
  verifiedCount: number
  avgPrice: string
  cheapestPrice: string
  cheapestPub: string
  cheapestPubSlug: string
  mostExpensivePrice: string
  happyHourCount: number
}

// toSuburbSlug is the canonical URL-slug kernel; it now lives in ./urls (the
// pure URL seam). Re-exported here so existing `@/lib/supabase` importers and
// the internal getAllSuburbs() usage below keep working unchanged.
export { toSuburbSlug }

export async function getAllSuburbs(): Promise<SuburbInfo[]> {
  const pubs = await getPubs()
  const grouped: Record<string, typeof pubs> = {}
  
  for (const pub of pubs) {
    if (!pub.suburb) continue
    if (!grouped[pub.suburb]) grouped[pub.suburb] = []
    grouped[pub.suburb].push(pub)
  }

  const suburbs: SuburbInfo[] = []
  for (const [suburb, subPubs] of Object.entries(grouped)) {
    const priced = subPubs.filter(p => p.price !== null && p.price > 0)
    const verified = subPubs.filter(p => p.priceVerified)
    const cheapest = priced.length > 0 
      ? priced.reduce((min, p) => p.price! < min.price! ? p : min, priced[0])
      : null
    const mostExpensive = priced.length > 0
      ? priced.reduce((max, p) => p.price! > max.price! ? p : max, priced[0])
      : null
    const avg = priced.length > 0
      ? (priced.reduce((s, p) => s + p.price!, 0) / priced.length).toFixed(2)
      : '0'
    const hhCount = subPubs.filter(p => p.happyHour && p.happyHour.trim() !== '').length

    suburbs.push({
      name: suburb,
      slug: toSuburbSlug(suburb),
      pubCount: subPubs.length,
      verifiedCount: verified.length,
      avgPrice: avg,
      cheapestPrice: cheapest ? cheapest.price!.toFixed(2) : 'TBC',
      cheapestPub: cheapest?.name || '',
      cheapestPubSlug: cheapest?.slug || '',
      mostExpensivePrice: mostExpensive ? mostExpensive.price!.toFixed(2) : 'TBC',
      happyHourCount: hhCount,
    })
  }

  suburbs.sort((a, b) => a.name.localeCompare(b.name))
  return suburbs
}

export async function getSuburbAveragePrice(suburbName: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('pubs')
    .select('price')
    .eq('suburb', suburbName)
    .not('price', 'is', null)
    .gt('price', 0)

  if (error || !data || data.length === 0) return null

  const prices = data.map(row => Number(row.price)).filter(price => Number.isFinite(price) && price > 0)
  if (prices.length === 0) return null

  return prices.reduce((sum, price) => sum + price, 0) / prices.length
}

export async function getSuburbBySlug(slug: string): Promise<SuburbInfo | null> {
  const suburbs = await getAllSuburbs()
  return suburbs.find(s => s.slug === slug) || null
}

export async function getSuburbPubs(suburbName: string): Promise<Pub[]> {
  const allPubs = await getPubs()
  return allPubs
    .filter(p => p.suburb === suburbName)
    .sort((a, b) => {
      if (a.price === null && b.price === null) return 0
      if (a.price === null) return 1
      if (b.price === null) return -1
      return a.price - b.price
    })
}

export async function getNearbySuburbs(suburbName: string, limit: number = 5): Promise<SuburbInfo[]> {
  // Get pubs in the target suburb to find their average lat/lng
  const allPubs = await getPubs()
  const suburbPubs = allPubs.filter(p => p.suburb === suburbName)
  if (suburbPubs.length === 0) return []

  const avgLat = suburbPubs.reduce((s, p) => s + p.lat, 0) / suburbPubs.length
  const avgLng = suburbPubs.reduce((s, p) => s + p.lng, 0) / suburbPubs.length

  // Find other suburbs and their average positions
  const grouped: Record<string, typeof allPubs> = {}
  for (const pub of allPubs) {
    if (!pub.suburb || pub.suburb === suburbName) continue
    if (!grouped[pub.suburb]) grouped[pub.suburb] = []
    grouped[pub.suburb].push(pub)
  }

  const suburbDistances: { name: string; distance: number }[] = []
  for (const [suburb, pubs] of Object.entries(grouped)) {
    const sLat = pubs.reduce((s, p) => s + p.lat, 0) / pubs.length
    const sLng = pubs.reduce((s, p) => s + p.lng, 0) / pubs.length
    const dist = Math.sqrt(Math.pow(sLat - avgLat, 2) + Math.pow(sLng - avgLng, 2))
    suburbDistances.push({ name: suburb, distance: dist })
  }

  suburbDistances.sort((a, b) => a.distance - b.distance)
  const nearbyNames = suburbDistances.slice(0, limit).map(s => s.name)

  const allSuburbs = await getAllSuburbs()
  return allSuburbs.filter(s => nearbyNames.includes(s.name))
}
