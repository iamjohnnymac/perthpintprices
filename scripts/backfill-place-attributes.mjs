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
import { readFile } from 'fs/promises'

config({ path: '.env.local' })

// Curated photo overrides: slug -> stable photo ref to force, or "NONE" to hide.
// Written by the vision-curation pass; lets a human/AI pick beat the auto-heuristic
// and persist across the monthly refresh.
const PHOTO_OVERRIDES = JSON.parse(await readFile('scripts/photo-overrides.json', 'utf8').catch(() => '{}'))

const DRY = process.argv.includes('--dry-run')
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : null
// --happy-hour: only sweep pubs that have a happy hour (the listicle set, ~169) —
// keeps a mid-month re-run inside Google's free Details quota.
const HAPPY_HOUR_ONLY = process.argv.includes('--happy-hour')
// --missing-photos: only sweep pubs that don't yet have a google_photo_url, so a
// follow-up run fills the rest without re-paying for pubs already done.
const MISSING_PHOTOS_ONLY = process.argv.includes('--missing-photos')
// --photos-only: light Place Details call (photos field = cheap Essentials SKU,
// 10k free/month) that re-picks + refreshes ONLY the photo columns. Lets us improve
// photo selection mid-month without re-paying the Enterprise amenity sweep.
const PHOTOS_ONLY = process.argv.includes('--photos-only')
// --overrides-only: only sweep pubs that have a curated photo override (apply picks).
const OVERRIDES_ONLY = process.argv.includes('--overrides-only')

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
  'photos',
].join(',')

// One photo per pub, max width for a listicle hero. The `photos` field rides in
// the existing Details call at $0; only the media resolve below is a billable
// Place Photo call (1,000 free/month — a monthly full sweep of ~857 stays free).
const PHOTO_MAX_WIDTH = 1024

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

// Pick the most hero-worthy photo rather than blindly taking photos[0]. Google's
// first photo is often a random user snap (selfie, food, a cropped head). We prefer
// the venue's OWN (business-attributed) landscape shots and demote portrait photos.
function pickBestPhoto(photos, pubName, slug) {
  if (!Array.isArray(photos) || photos.length === 0) return null
  // Curated override: force a specific photo by its stable ref (skip the heuristic).
  const overrideRef = PHOTO_OVERRIDES[slug]
  if (overrideRef && overrideRef !== 'NONE') {
    const forced = photos.find((p) => (p.name || '').endsWith(`/photos/${overrideRef}`))
    if (forced) return forced
  }
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const pn = norm(pubName)
  const scored = photos.map((photo, idx) => {
    const w = photo.widthPx || 0
    const h = photo.heightPx || 0
    const ratio = h > 0 ? w / h : 1
    const author = norm(photo.authorAttributions?.[0]?.displayName)
    const businessOwned = Boolean(author && pn && (author.includes(pn) || pn.includes(author)))
    let s = 0
    if (businessOwned) s += 6       // the venue's own cover/marketing shot — usually best
    if (ratio >= 1.5) s += 3        // wide landscape — exterior/interior hero
    else if (ratio >= 1.2) s += 2
    else if (ratio < 0.95) s -= 3   // portrait — selfies, food, menus, cropped heads
    if (w >= 1200) s += 1           // decent resolution
    s -= idx * 0.2                  // mild tiebreak toward Google's own ordering
    return { photo, s }
  })
  scored.sort((a, b) => b.s - a.s)
  return scored[0].photo
}

// Resolve the chosen photo to a usable image URL + its required attribution.
// We never persist the photo `name` (it expires); we store the resolved photoUri
// and re-derive it on every sweep, keeping us inside Google's caching window.
async function resolvePhoto(json, pubName, slug) {
  const photo = pickBestPhoto(json.photos, pubName, slug)
  if (!photo?.name) return null
  const attr = photo.authorAttributions?.[0] || null
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&skipHttpRedirect=true`,
      { headers: { 'X-Goog-Api-Key': GOOGLE_KEY } },
    )
    if (!res.ok) return null
    const media = await res.json()
    if (!media.photoUri) return null
    return {
      google_photo_url: media.photoUri,
      google_photo_attribution: attr?.displayName || null,
      google_photo_attribution_uri: attr?.uri || null,
    }
  } catch {
    return null
  }
}

// ── Load pubs with a place_id ────────────────────────────────────────────
let query = supabase
  .from('pubs')
  .select('id, name, slug, suburb, place_id, website')
  .not('place_id', 'is', null)
if (HAPPY_HOUR_ONLY) query = query.not('happy_hour', 'is', null)
if (MISSING_PHOTOS_ONLY) query = query.is('google_photo_url', null)
if (OVERRIDES_ONLY) query = query.in('slug', Object.keys(PHOTO_OVERRIDES))
query = query.order('id')
if (LIMIT) query = query.limit(LIMIT)

const { data: pubs, error } = await query
if (error) throw error
console.log(`${pubs.length} pubs with place_id${HAPPY_HOUR_ONLY ? ' + happy hour' : ''}${MISSING_PHOTOS_ONLY ? ' + missing photo' : ''}${LIMIT ? ` (limited to ${LIMIT})` : ''}\n`)

// ── Sweep ────────────────────────────────────────────────────────────────
const BOOL_FIELDS = [
  'serves_beer', 'serves_food', 'outdoor_seating', 'good_for_children', 'good_for_groups',
  'good_for_watching_sports', 'allows_dogs', 'live_music', 'restroom', 'reservable',
]
const coverage = Object.fromEntries(
  [...BOOL_FIELDS, 'google_rating', 'google_editorial_summary', 'google_opening_hours', 'google_photo_url'].map((k) => [k, 0])
)
let written = 0
let failed = 0
let websiteFilled = 0

for (const p of pubs) {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${p.place_id}`, {
      headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': PHOTOS_ONLY ? 'photos' : FIELD_MASK },
    })
    if (!res.ok) {
      console.log(`  ! ${p.name}: HTTP ${res.status}`)
      failed++
      continue
    }
    const json = await res.json()
    const update = PHOTOS_ONLY ? {} : mapResponse(json)

    if (!PHOTOS_ONLY) {
      for (const f of BOOL_FIELDS) if (update[f] === true) coverage[f]++
      if (update.google_rating != null) coverage.google_rating++
      if (update.google_editorial_summary) coverage.google_editorial_summary++
      if (update.google_opening_hours) coverage.google_opening_hours++
    }

    // Resolve + attach one attributed photo (separate billable Place Photo call).
    if (PHOTO_OVERRIDES[p.slug] === 'NONE') {
      update.google_photo_url = null
      update.google_photo_attribution = null
      update.google_photo_attribution_uri = null
    } else {
      const photo = await resolvePhoto(json, p.name, p.slug)
      if (photo?.google_photo_url) {
        Object.assign(update, photo)
        coverage.google_photo_url++
        if (DRY) console.log(`  · ${p.name}: photo ${photo.google_photo_attribution ? `by ${photo.google_photo_attribution}` : '(no attribution)'} → ${photo.google_photo_url.slice(0, 64)}…`)
      }
    }

    // website is the only curated-column fill — gated on blank.
    if (!p.website && json.websiteUri) {
      update.website = json.websiteUri
      websiteFilled++
    }

    if (Object.keys(update).length === 0) { await new Promise((r) => setTimeout(r, 80)); continue }
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
