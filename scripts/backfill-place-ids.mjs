#!/usr/bin/env node
/**
 * Backfill Google Places `place_id` onto every row in the `pubs` table.
 *
 * For each pub:
 *   1. Query Places API (New) `places:searchText` with "{name} {suburb} Perth WA"
 *   2. Pick the top result; compute confidence from name similarity + lat/lng distance
 *   3. high  -> write place_id straight to Supabase
 *      mid   -> write but log for spot-check
 *      low   -> skip, log to review JSON for manual decision
 *
 * Usage:
 *   node scripts/backfill-place-ids.mjs              # writes to DB
 *   node scripts/backfill-place-ids.mjs --dry-run    # JSON output only
 *   node scripts/backfill-place-ids.mjs --limit 20   # try first 20 only
 *
 * Env (.env.local):
 *   GOOGLE_PLACES_API_KEY=...                          (required)
 *   NEXT_PUBLIC_SUPABASE_URL=...                       (defaults to project)
 *   SUPABASE_SERVICE_ROLE_KEY=...                      (required for writes; falls back to anon for dry-run)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit')
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : null
})()

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!GOOGLE_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY in .env.local')
  process.exit(1)
}

// Matches the checked-in fallbacks in src/lib/supabase.ts so the script runs without extra env.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPABASE_ANON_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  SUPABASE_ANON_FALLBACK
if (!DRY_RUN && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Refusing to write with anon key. Use --dry-run or set SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Haversine in meters
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

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\b(the|hotel|tavern|pub|bar|brewery|inn|wa|perth)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function nameSimilarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.85
  // Token overlap
  const ta = new Set(na.split(' ').filter((t) => t.length > 2))
  const tb = new Set(nb.split(' ').filter((t) => t.length > 2))
  if (!ta.size || !tb.size) return 0
  let overlap = 0
  for (const t of ta) if (tb.has(t)) overlap++
  return overlap / Math.max(ta.size, tb.size)
}

async function searchPlace(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.businessStatus,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 3,
      locationBias: {
        // Perth metro circle (centred on CBD, 50km radius = Places API max)
        circle: { center: { latitude: -31.9523, longitude: 115.8613 }, radius: 50000 },
      },
      regionCode: 'AU',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Places ${res.status}: ${body}`)
  }
  const json = await res.json()
  return json.places || []
}

function classify(pub, candidate) {
  if (!candidate) return { tier: 'none', score: 0, distance: null }
  const nameScore = nameSimilarity(pub.name, candidate.displayName?.text)
  const distance =
    candidate.location && pub.lat && pub.lng
      ? distanceMeters(pub.lat, pub.lng, candidate.location.latitude, candidate.location.longitude)
      : null
  const operational = candidate.businessStatus === 'OPERATIONAL'

  // Tier rules
  let tier = 'low'
  if (nameScore >= 0.85 && distance !== null && distance < 200 && operational) tier = 'high'
  else if (nameScore >= 0.6 && distance !== null && distance < 500 && operational) tier = 'mid'
  else if (nameScore >= 0.5 && distance !== null && distance < 1000) tier = 'low'
  else tier = 'reject'
  return { tier, nameScore, distance, operational }
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}`)
  const { data: pubs, error } = await supabase
    .from('pubs')
    .select('id, name, slug, suburb, address, lat, lng, place_id')
    .order('id')
  if (error) throw error

  const todo = pubs.filter((p) => !p.place_id)
  console.log(`${pubs.length} pubs total, ${todo.length} missing place_id`)

  const subset = LIMIT ? todo.slice(0, LIMIT) : todo
  console.log(`Processing ${subset.length} pubs\n`)

  const review = []
  let high = 0,
    mid = 0,
    low = 0,
    reject = 0,
    errored = 0

  for (let i = 0; i < subset.length; i++) {
    const pub = subset[i]
    const query = `${pub.name} ${pub.suburb} Perth WA`
    process.stdout.write(`[${i + 1}/${subset.length}] ${pub.name} (${pub.suburb})... `)
    try {
      const candidates = await searchPlace(query)
      const top = candidates[0]
      const cls = classify(pub, top)
      const record = {
        pubId: pub.id,
        pubName: pub.name,
        pubSuburb: pub.suburb,
        query,
        tier: cls.tier,
        nameScore: Number((cls.nameScore || 0).toFixed(2)),
        distanceMeters: cls.distance != null ? Math.round(cls.distance) : null,
        candidate: top
          ? {
              place_id: top.id,
              name: top.displayName?.text,
              address: top.formattedAddress,
              primaryType: top.primaryType,
              businessStatus: top.businessStatus,
              website: top.websiteUri || null,
              phone: top.nationalPhoneNumber || top.internationalPhoneNumber || null,
              lat: top.location?.latitude,
              lng: top.location?.longitude,
            }
          : null,
      }

      if (cls.tier === 'high') high++
      else if (cls.tier === 'mid') mid++
      else if (cls.tier === 'low') low++
      else reject++

      console.log(cls.tier.toUpperCase(), top ? `→ ${top.displayName?.text}` : '(no result)')

      if ((cls.tier === 'high' || cls.tier === 'mid') && !DRY_RUN) {
        const { error: upErr } = await supabase
          .from('pubs')
          .update({ place_id: top.id })
          .eq('id', pub.id)
        if (upErr) console.warn(`   ! write failed: ${upErr.message}`)
      }

      review.push(record)
    } catch (e) {
      errored++
      console.log('ERROR:', e.message)
      review.push({ pubId: pub.id, pubName: pub.name, error: e.message })
    }

    // Gentle pacing — 100ms between calls is way under quota
    await new Promise((r) => setTimeout(r, 100))
  }

  const out = `scripts/backfill-place-ids-results.json`
  writeFileSync(out, JSON.stringify({ summary: { high, mid, low, reject, errored }, review }, null, 2))
  console.log(`\nSummary: ${high} high, ${mid} mid, ${low} low, ${reject} reject, ${errored} errors`)
  console.log(`Review file: ${out}`)
  if (DRY_RUN) console.log('(dry-run — no DB writes)')
  else console.log(`Wrote place_id for ${high + mid} pubs (high + mid tiers)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
