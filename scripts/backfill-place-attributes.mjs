#!/usr/bin/env node
/**
 * Backfill Google Places (New) attributes for every pub with a place_id.
 *
 * One Place Details GET per pub. Because we request amenity booleans
 * (servesBeer, outdoorSeating, ...), the whole call is billed at the
 * Enterprise + Atmosphere SKU — so we pull EVERYTHING useful in the same call
 * at zero marginal cost (rating, priceLevel, hours, businessStatus, summary).
 *
 * Cost: the Enterprise+Atmosphere free quota is 1,000 calls/month. ~857 pubs
 * fit in one sweep for $0. Re-run monthly and stay free; only calls past 1,000
 * in a calendar month bill at $25/1,000.
 *
 * Google's signal is stored in SEPARATE columns (serves_beer, outdoor_seating,
 * ...) — it never overwrites the hand-curated has_tab/kid_friendly/cozy_pub/
 * sunset_spot columns. website is the one exception: filled only when blank.
 *
 * Usage:
 *   node scripts/backfill-place-attributes.mjs --dry-run            # no writes, prints coverage
 *   node scripts/backfill-place-attributes.mjs --dry-run --limit 15 # validate mapping cheaply
 *   node scripts/backfill-place-attributes.mjs                      # full sweep, writes prod
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY = process.argv.includes('--dry-run')
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : null

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!GOOGLE_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// One FieldMask — already Enterprise+Atmosphere because of the amenity booleans.
const FIELD_MASK = [
  'servesBeer',
  'servesDinner',
  'servesLunch',
  'servesBreakfast',
  'outdoorSeating',
  'goodForChildren',
  'goodForGroups',
  'goodForWatchingSports',
  'allowsDogs',
  'liveMusic',
  'restroom',
  'reservable',
  'rating',
  'userRatingCount',
  'priceLevel',
  'businessStatus',
  'editorialSummary',
  'regularOpeningHours',
  'websiteUri',
].join(',')

/** true if any signal is true; false if all present signals are false; null if all unknown. */
function anyTrue(...vals) {
  if (vals.some((v) => v === true)) return true
  if (vals.some((v) => v === false)) return false
  return null
}

// Guard the DB check constraint: only persist the three known enum values.
const VALID_BUSINESS_STATUS = new Set(['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'])
function normalizeBusinessStatus(value) {
  return VALID_BUSINESS_STATUS.has(value) ? value : null
}

function mapResponse(json) {
  return {
    serves_beer: typeof json.servesBeer === 'boolean' ? json.servesBeer : null,
    serves_food: anyTrue(json.servesDinner, json.servesLunch, json.servesBreakfast),
    outdoor_seating: typeof json.outdoorSeating === 'boolean' ? json.outdoorSeating : null,
    good_for_children: typeof json.goodForChildren === 'boolean' ? json.goodForChildren : null,
    good_for_groups: typeof json.goodForGroups === 'boolean' ? json.goodForGroups : null,
    good_for_watching_sports:
      typeof json.goodForWatchingSports === 'boolean' ? json.goodForWatchingSports : null,
    allows_dogs: typeof json.allowsDogs === 'boolean' ? json.allowsDogs : null,
    live_music: typeof json.liveMusic === 'boolean' ? json.liveMusic : null,
    restroom: typeof json.restroom === 'boolean' ? json.restroom : null,
    reservable: typeof json.reservable === 'boolean' ? json.reservable : null,
    google_rating: typeof json.rating === 'number' ? json.rating : null,
    google_rating_count: typeof json.userRatingCount === 'number' ? json.userRatingCount : null,
    google_price_level: json.priceLevel || null,
    business_status: normalizeBusinessStatus(json.businessStatus),
    google_editorial_summary: json.editorialSummary?.text || null,
    google_opening_hours: json.regularOpeningHours || null,
    google_attrs_updated_at: new Date().toISOString(),
  }
}

// ── Load pubs with a place_id ────────────────────────────────────────────
let query = supabase
  .from('pubs')
  .select('id, name, suburb, place_id, website')
  .not('place_id', 'is', null)
  .order('id')
if (LIMIT) query = query.limit(LIMIT)

const { data: pubs, error } = await query
if (error) throw error
console.log(`${pubs.length} pubs with place_id${LIMIT ? ` (limited to ${LIMIT})` : ''}\n`)

// ── Sweep ────────────────────────────────────────────────────────────────
const BOOL_FIELDS = [
  'serves_beer', 'serves_food', 'outdoor_seating', 'good_for_children', 'good_for_groups',
  'good_for_watching_sports', 'allows_dogs', 'live_music', 'restroom', 'reservable',
]
const coverage = Object.fromEntries(
  [...BOOL_FIELDS, 'google_rating', 'google_editorial_summary', 'google_opening_hours'].map((k) => [k, 0])
)
let written = 0
let failed = 0
let websiteFilled = 0

for (const p of pubs) {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${p.place_id}`, {
      headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': FIELD_MASK },
    })
    if (!res.ok) {
      console.log(`  ! ${p.name}: HTTP ${res.status}`)
      failed++
      continue
    }
    const json = await res.json()
    const update = mapResponse(json)

    for (const f of BOOL_FIELDS) if (update[f] === true) coverage[f]++
    if (update.google_rating != null) coverage.google_rating++
    if (update.google_editorial_summary) coverage.google_editorial_summary++
    if (update.google_opening_hours) coverage.google_opening_hours++

    // website is the only curated-column fill — gated on blank.
    if (!p.website && json.websiteUri) {
      update.website = json.websiteUri
      websiteFilled++
    }

    if (!DRY) {
      const { error: e } = await supabase.from('pubs').update(update).eq('id', p.id)
      if (e) { console.log(`  ! update ${p.name}: ${e.message}`); failed++; continue }
    }
    written++
    await new Promise((r) => setTimeout(r, 80))
  } catch (e) {
    console.log(`  ! ${p.name}: ${e.message}`)
    failed++
  }
}

// ── Report ───────────────────────────────────────────────────────────────
console.log(`\nCoverage (pubs where Google says TRUE / has a value), n=${pubs.length}:`)
for (const [k, v] of Object.entries(coverage)) {
  const pct = pubs.length ? Math.round((v / pubs.length) * 100) : 0
  console.log(`  ${k.padEnd(26)} ${String(v).padStart(4)}  (${pct}%)`)
}
console.log(`\nwebsite filled (was blank): ${websiteFilled}`)
console.log(`failed: ${failed}`)
console.log(DRY ? `\n(dry run — no writes; ${written} pubs would update)` : `\nWritten: ${written}`)
