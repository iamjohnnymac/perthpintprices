#!/usr/bin/env node
/**
 * Insert discovered venues into the pubs table.
 *
 * Reads scripts/discover-venues-results.json and inserts candidates in the
 * chosen tiers. Dedupes three ways:
 *   1. skip if place_id already exists on a pub row
 *   2. skip if an existing pub has the same normalized name + suburb
 *   3. skip if an existing pub is within 30m of the candidate (same venue,
 *      different name)
 *
 * Generates a unique slug by appending the suburb / a numeric suffix as needed.
 *
 * Usage:
 *   node scripts/insert-discovered-venues.mjs                        # dry run, HIGH only
 *   node scripts/insert-discovered-venues.mjs --tiers high,medium    # choose tiers
 *   node scripts/insert-discovered-venues.mjs --apply                # actually insert
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const getArg = (flag, def) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : def
}
const TIERS = new Set(getArg('--tiers', 'high').split(','))

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  KEY
)

function normaliseName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/\b(the|hotel|tavern|pub|bar|brewery|inn|cafe|restaurant|wa|perth)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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

const results = JSON.parse(readFileSync('scripts/discover-venues-results.json', 'utf8'))
const pool = results.candidates.filter((c) => TIERS.has(c.tier))

console.log(`Tiers: ${[...TIERS].join(', ')}`)
console.log(`Candidates in scope: ${pool.length}`)
console.log(`Mode: ${APPLY ? 'APPLY (writes)' : 'DRY RUN'}\n`)

// Load existing pubs for dedupe
const { data: pubs, error } = await supabase.from('pubs').select('id, name, suburb, slug, lat, lng, place_id')
if (error) throw error

const existingPlaceIds = new Set(pubs.map((p) => p.place_id).filter(Boolean))
const existingByNameSuburb = new Map()
for (const p of pubs) {
  const k = `${normaliseName(p.name)}|${(p.suburb || '').toLowerCase()}`
  existingByNameSuburb.set(k, p)
}
const existingSlugs = new Set(pubs.map((p) => p.slug).filter(Boolean))

function nearbyExisting(lat, lng) {
  if (!lat || !lng) return null
  for (const p of pubs) {
    if (!p.lat || !p.lng) continue
    if (distanceMeters(lat, lng, p.lat, p.lng) <= 30) return p
  }
  return null
}

function uniqueSlug(base, suburb) {
  let slug = base
  if (!existingSlugs.has(slug)) return slug
  slug = `${base}-${slugify(suburb)}`
  if (!existingSlugs.has(slug)) return slug
  let n = 2
  while (existingSlugs.has(`${slug}-${n}`)) n++
  return `${slug}-${n}`
}

const toInsert = []
const skipped = { placeId: 0, nameSuburb: 0, proximity: 0, noCoords: 0 }

for (const c of pool) {
  if (existingPlaceIds.has(c.place_id)) {
    skipped.placeId++
    continue
  }
  if (!c.lat || !c.lng) {
    skipped.noCoords++
    continue
  }
  const key = `${normaliseName(c.name)}|${(c.suburb || '').toLowerCase()}`
  if (existingByNameSuburb.has(key)) {
    skipped.nameSuburb++
    continue
  }
  const near = nearbyExisting(c.lat, c.lng)
  if (near) {
    skipped.proximity++
    continue
  }
  const baseSlug = slugify(c.name)
  const slug = uniqueSlug(baseSlug, c.suburb)
  existingSlugs.add(slug)
  // Map Google primary type → loose vibe tag
  const vibeMap = {
    wine_bar: 'wine bar',
    cocktail_bar: 'cocktail bar',
    sports_bar: 'sports bar',
    night_club: 'nightclub',
    brewery: 'brewery',
    brewpub: 'brewpub',
    gastropub: 'gastropub',
    lounge_bar: 'lounge',
    bar_and_grill: 'bar and grill',
    pub: 'pub',
    bar: 'bar',
  }
  toInsert.push({
    name: c.name,
    slug,
    suburb: c.suburb,
    address: c.address || '',
    lat: c.lat,
    lng: c.lng,
    website: c.website || null,
    place_id: c.place_id,
    vibe_tag: vibeMap[c.primaryType] || null,
    price_verified: false, // no price yet — flag for phone agent / user submission
    beer_type: '',
  })
}

console.log(`Insert: ${toInsert.length}`)
console.log(`Skipped: ${skipped.placeId} place_id dupe, ${skipped.nameSuburb} name+suburb dupe, ${skipped.proximity} within 30m of existing, ${skipped.noCoords} missing coords\n`)

if (!APPLY) {
  console.log('Sample of first 10 to be inserted:')
  for (const v of toInsert.slice(0, 10)) {
    console.log(`  ${v.name} (${v.suburb}) — ${v.vibe_tag || '?'} — slug=${v.slug}`)
  }
  console.log('\n(re-run with --apply to insert)')
  process.exit(0)
}

// Insert in batches of 50 to avoid hitting any request-size limits
let inserted = 0
let failed = 0
for (let i = 0; i < toInsert.length; i += 50) {
  const batch = toInsert.slice(i, i + 50)
  const { error: insErr, data } = await supabase.from('pubs').insert(batch).select('id')
  if (insErr) {
    console.log(`  ! batch ${i}–${i + batch.length} failed: ${insErr.message}`)
    failed += batch.length
  } else {
    inserted += data.length
    process.stdout.write(`\rInserted ${inserted}/${toInsert.length}...`)
  }
}

console.log(`\n\nDone. Inserted ${inserted}, failed ${failed}.`)
