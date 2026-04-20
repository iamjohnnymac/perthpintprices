#!/usr/bin/env node
/**
 * Venue discovery — find bars/pubs/breweries in Perth that we don't already have.
 *
 * Strategy: use every existing pub's lat/lng as a seed. For each seed run
 * `places:searchNearby` with the drink-led primary types. Dedupe candidates
 * against existing pubs (by place_id) and against each other (by place_id).
 * Output candidates grouped by suburb for review.
 *
 * Usage:
 *   node scripts/discover-venues.mjs                     # full run
 *   node scripts/discover-venues.mjs --seeds 30          # first 30 seeds only (sampling)
 *   node scripts/discover-venues.mjs --radius 2000       # override seed radius (default 1500m)
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = process.argv.slice(2)
const getArg = (flag, def) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : def
}

const SEED_LIMIT = parseInt(getArg('--seeds', '0'), 10) || null
const RADIUS = parseInt(getArg('--radius', '1500'), 10)

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!GOOGLE_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

// Drink-led primary types — these are the categories most likely to serve a pint.
// Deliberately skip `restaurant` (needs servesBeer filter on Enterprise SKU) and
// `liquor_store` (bottle shops, not pints).
const INCLUDED_TYPES = [
  'bar',
  'pub',
  'wine_bar',
  'brewery',
  'brewpub',
  'cocktail_bar',
  'sports_bar',
  'night_club',
]

// Primary types we reject even if Google matched a secondary drink-type.
// These sneak in because Google's includedTypes filter matches any type in the array,
// but a coffee_shop with "bar" as a secondary type isn't what we want.
const REJECT_PRIMARY = new Set([
  'cafe',
  'coffee_shop',
  'bakery',
  'liquor_store',
  'fast_food_restaurant',
  'hotel',
  'resort_hotel',
  'hostel',
  'tour_agency',
  'art_gallery',
  'tea_house',
  'food_court',
  'bowling_alley',
  'association_or_organization',
])

// For restaurants: keep only if one of these appears in types[] (meaning it doubles as a pub/bar).
const RESTAURANT_KEEP_IF_IN_TYPES = new Set(['bar', 'pub', 'brewery', 'brewpub', 'gastropub'])

function shouldKeep(place) {
  if (place.businessStatus === 'CLOSED_PERMANENTLY') return false
  const primary = place.primaryType || ''
  const types = place.types || []
  if (REJECT_PRIMARY.has(primary)) return false
  if (primary.endsWith('_restaurant') || primary === 'restaurant') {
    return types.some((t) => RESTAURANT_KEEP_IF_IN_TYPES.has(t))
  }
  return true
}

async function searchNearby(lat, lng) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.businessStatus,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber',
    },
    body: JSON.stringify({
      includedTypes: INCLUDED_TYPES,
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: RADIUS } },
      rankPreference: 'DISTANCE',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  return json.places || []
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

async function main() {
  const { data: pubs, error } = await supabase
    .from('pubs')
    .select('id, name, suburb, lat, lng, place_id')
  if (error) throw error

  const knownPlaceIds = new Set(pubs.map((p) => p.place_id).filter(Boolean))
  const seeds = pubs.filter((p) => p.lat && p.lng)
  const seedSubset = SEED_LIMIT ? seeds.slice(0, SEED_LIMIT) : seeds

  console.log(`${pubs.length} pubs in DB, ${knownPlaceIds.size} with place_id`)
  console.log(`${seedSubset.length} seeds, ${RADIUS}m radius each, ${INCLUDED_TYPES.length} included types`)
  console.log(`Estimated calls: ${seedSubset.length}\n`)

  const candidates = new Map() // place_id -> candidate
  let atCap = 0
  let errored = 0

  for (let i = 0; i < seedSubset.length; i++) {
    const seed = seedSubset[i]
    process.stdout.write(`[${i + 1}/${seedSubset.length}] ${seed.name} (${seed.suburb})... `)
    try {
      const results = await searchNearby(seed.lat, seed.lng)
      let added = 0
      for (const r of results) {
        if (!r.id || knownPlaceIds.has(r.id)) continue
        if (!shouldKeep(r)) continue
        if (!candidates.has(r.id)) {
          // Guess the suburb from the closest existing pub we already know
          let nearestSuburb = seed.suburb
          let nearestDist = distanceMeters(
            seed.lat,
            seed.lng,
            r.location?.latitude ?? seed.lat,
            r.location?.longitude ?? seed.lng
          )
          for (const p of pubs) {
            if (!p.lat || !p.lng || !r.location) continue
            const d = distanceMeters(p.lat, p.lng, r.location.latitude, r.location.longitude)
            if (d < nearestDist) {
              nearestDist = d
              nearestSuburb = p.suburb
            }
          }
          candidates.set(r.id, {
            place_id: r.id,
            name: r.displayName?.text,
            address: r.formattedAddress,
            primaryType: r.primaryType,
            types: r.types,
            businessStatus: r.businessStatus,
            website: r.websiteUri || null,
            phone: r.nationalPhoneNumber || r.internationalPhoneNumber || null,
            lat: r.location?.latitude,
            lng: r.location?.longitude,
            suburb: nearestSuburb,
            seed_pub_id: seed.id,
          })
          added++
        }
      }
      if (results.length >= 20) atCap++
      console.log(`${results.length} results, ${added} new (total: ${candidates.size})${results.length >= 20 ? ' ⚠ at cap' : ''}`)
    } catch (e) {
      errored++
      console.log('ERROR:', e.message)
    }
    await new Promise((r) => setTimeout(r, 80))
  }

  // Summarise by primary type + suburb
  const byType = {}
  const bySuburb = {}
  for (const c of candidates.values()) {
    byType[c.primaryType || 'unknown'] = (byType[c.primaryType || 'unknown'] || 0) + 1
    bySuburb[c.suburb || 'unknown'] = (bySuburb[c.suburb || 'unknown'] || 0) + 1
  }

  const out = Array.from(candidates.values()).sort((a, b) => (a.suburb || '').localeCompare(b.suburb || ''))
  writeFileSync(
    'scripts/discover-venues-results.json',
    JSON.stringify({ summary: { total: out.length, atCap, errored, byType, bySuburb }, candidates: out }, null, 2)
  )

  console.log(`\n=== Discovery summary ===`)
  console.log(`New candidates: ${candidates.size}`)
  console.log(`Seeds at 20-result cap: ${atCap} (may be under-covered)`)
  console.log(`Errored seeds: ${errored}`)
  console.log(`\nBy primary type:`)
  for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${v}`)
  console.log(`\nTop 15 suburbs by new candidates:`)
  for (const [k, v] of Object.entries(bySuburb)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15))
    console.log(`  ${k.padEnd(25)} ${v}`)
  console.log(`\nWritten: scripts/discover-venues-results.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
