#!/usr/bin/env node
/**
 * Backfill pub.phone from two sources:
 *   1. scripts/discover-venues-results.json (free — we already fetched these)
 *   2. Google Places Place Details for any pub with a place_id but no phone
 *      (paid, but well inside free tier for ~800 rows)
 *
 * Skips pubs that already have a phone or don't have a place_id.
 *
 * Usage:
 *   node scripts/backfill-phones.mjs --dry-run
 *   node scripts/backfill-phones.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY = process.argv.includes('--dry-run')

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!GOOGLE_KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Step 1: load phones from cached discovery JSON ──────────────────────
const phoneByPlaceId = new Map()
for (const f of ['scripts/discover-venues-results.json', 'scripts/backfill-place-ids-results.json']) {
  if (!existsSync(f)) continue
  const data = JSON.parse(readFileSync(f, 'utf8'))
  const rows = data.candidates || data.review || []
  for (const r of rows) {
    const c = r.candidate || r
    if (c?.place_id && c?.phone) phoneByPlaceId.set(c.place_id, c.phone)
  }
}
console.log(`Cached phones from discovery JSON: ${phoneByPlaceId.size}`)

// ── Step 2: load pubs needing a phone ───────────────────────────────────
const { data: pubs, error } = await supabase
  .from('pubs')
  .select('id, name, suburb, phone, place_id')
  .not('place_id', 'is', null)
if (error) throw error

const needsPhone = pubs.filter((p) => !p.phone)
console.log(`${pubs.length} pubs with place_id, ${needsPhone.length} missing phone\n`)

// ── Step 3: apply cached phones first ───────────────────────────────────
let fromCache = 0
let fromApi = 0
let stillMissing = 0

for (const p of needsPhone) {
  let phone = phoneByPlaceId.get(p.place_id)
  if (phone) {
    if (!DRY) {
      const { error: e } = await supabase.from('pubs').update({ phone }).eq('id', p.id)
      if (e) console.log(`  ! update ${p.name}: ${e.message}`)
    }
    fromCache++
    continue
  }

  // ── Step 4: Place Details fallback ─────────────────────────────────────
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${p.place_id}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'nationalPhoneNumber,internationalPhoneNumber',
      },
    })
    if (!res.ok) {
      stillMissing++
      continue
    }
    const json = await res.json()
    phone = json.nationalPhoneNumber || json.internationalPhoneNumber || null
    if (phone) {
      if (!DRY) await supabase.from('pubs').update({ phone }).eq('id', p.id)
      fromApi++
    } else {
      stillMissing++
    }
    await new Promise((r) => setTimeout(r, 80))
  } catch (e) {
    console.log(`  ! ${p.name}: ${e.message}`)
    stillMissing++
  }
}

console.log(`\nFrom discovery cache: ${fromCache}`)
console.log(`From Place Details API: ${fromApi}`)
console.log(`Still missing (no phone in Google): ${stillMissing}`)
console.log(DRY ? '(dry run — no writes)' : `Total written: ${fromCache + fromApi}`)
