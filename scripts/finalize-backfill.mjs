#!/usr/bin/env node
/**
 * Second pass after the initial place_id backfill.
 * Uses scripts/backfill-place-ids-results.json as input. Does four things:
 *
 *   1. Auto-accept near-zero-distance operational matches that failed the strict
 *      name check on the first pass (write place_id).
 *   2. List CLOSED_PERMANENTLY venues for deletion.
 *   3. List duplicate rows in `pubs` that collide on Google place_id.
 *   4. Dump the remaining uncertain cases to scripts/backfill-review.json.
 *
 * Run with --apply to actually execute deletions + duplicate merges; default is
 * report-only for writes #2 and #3. Bucket #1 (auto-accept writes) always runs.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const APPLY = process.argv.includes('--apply')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  KEY
)

const results = JSON.parse(readFileSync('scripts/backfill-place-ids-results.json', 'utf8'))
const review = results.review

// Bucket 1: auto-accept — distance <50m, operational, at least some name overlap
const autoAccept = review.filter((r) => {
  const c = r.candidate
  if (!c) return false
  if (c.businessStatus !== 'OPERATIONAL') return false
  if (r.distanceMeters == null || r.distanceMeters > 50) return false
  if ((r.nameScore || 0) < 0.4) return false
  return r.tier === 'low' || r.tier === 'reject'
})

// Bucket 2: closed permanently
const closed = review.filter((r) => r.candidate?.businessStatus === 'CLOSED_PERMANENTLY')

// Bucket 3: uncertain — reject or low, not auto-acceptable, not closed
const acceptIds = new Set(autoAccept.map((r) => r.pubId))
const closedIds = new Set(closed.map((r) => r.pubId))
const uncertain = review.filter(
  (r) => (r.tier === 'low' || r.tier === 'reject') && !acceptIds.has(r.pubId) && !closedIds.has(r.pubId)
)

console.log('=== Second-pass backfill ===')
console.log(`Auto-accept: ${autoAccept.length}`)
console.log(`Closed permanently: ${closed.length}`)
console.log(`Uncertain (manual review): ${uncertain.length}`)

// ── Bucket 1: auto-accept writes ────────────────────────────────────────
let acceptedCount = 0
let acceptFailed = []
for (const r of autoAccept) {
  const { error } = await supabase.from('pubs').update({ place_id: r.candidate.place_id }).eq('id', r.pubId)
  if (error) {
    acceptFailed.push({ pubId: r.pubId, pubName: r.pubName, error: error.message })
    console.log(`  ! ${r.pubName} (id=${r.pubId}): ${error.message}`)
  } else {
    acceptedCount++
  }
}
console.log(`\nBucket 1: wrote place_id for ${acceptedCount}/${autoAccept.length} auto-accepted pubs`)
if (acceptFailed.length) console.log(`  (${acceptFailed.length} failures — see log above)`)

// ── Bucket 2: closed permanently (delete if --apply) ────────────────────
console.log(`\nBucket 2: ${closed.length} closed-permanently pubs`)
for (const r of closed) {
  console.log(`  id=${r.pubId} ${r.pubName} (${r.pubSuburb})`)
}
if (APPLY && closed.length) {
  const ids = closed.map((r) => r.pubId)
  // price_history has FK to pubs — clear those first, then delete pubs
  const { error: phErr } = await supabase.from('price_history').delete().in('pub_id', ids)
  if (phErr) console.log(`  ! price_history cleanup: ${phErr.message}`)
  const { error: delErr } = await supabase.from('pubs').delete().in('id', ids)
  if (delErr) console.log(`  ! pubs delete: ${delErr.message}`)
  else console.log(`  ✓ deleted ${ids.length} closed pubs`)
} else if (closed.length) {
  console.log(`  (re-run with --apply to delete)`)
}

// ── Bucket 3: uncertain → review file ───────────────────────────────────
const reviewOut = uncertain.map((r) => ({
  pubId: r.pubId,
  pubName: r.pubName,
  pubSuburb: r.pubSuburb,
  candidateName: r.candidate?.name,
  candidateAddress: r.candidate?.address,
  candidateWebsite: r.candidate?.website,
  candidateBusinessStatus: r.candidate?.businessStatus,
  distanceMeters: r.distanceMeters,
  nameScore: r.nameScore,
  place_id: r.candidate?.place_id,
}))
writeFileSync('scripts/backfill-review.json', JSON.stringify(reviewOut, null, 2))
console.log(`\nBucket 3: ${uncertain.length} uncertain pubs written to scripts/backfill-review.json`)

// ── Bucket 4: detect duplicate rows by name+suburb (post-research-merge) ─
const { data: pubs } = await supabase.from('pubs').select('id, name, suburb, price, slug, last_updated').order('id')
const seen = new Map()
const dupes = []
for (const p of pubs) {
  const key = `${(p.name || '').toLowerCase().trim()}|${(p.suburb || '').toLowerCase().trim()}`
  if (seen.has(key)) dupes.push([seen.get(key), p])
  else seen.set(key, p)
}
console.log(`\nBucket 4: ${dupes.length} duplicate name+suburb pairs`)
for (const [a, b] of dupes) {
  console.log(`  KEEP id=${a.id} "${a.name}" (${a.suburb})  DROP id=${b.id}  price=${a.price}/${b.price}`)
}
if (APPLY && dupes.length) {
  for (const [keep, drop] of dupes) {
    // Move non-null fields from the drop row onto the keep row if missing there
    const merge = {}
    for (const k of ['price', 'happy_hour', 'happy_hour_price', 'website', 'last_updated']) {
      if (keep[k] == null && drop[k] != null) merge[k] = drop[k]
    }
    if (Object.keys(merge).length) {
      const { error } = await supabase.from('pubs').update(merge).eq('id', keep.id)
      if (error) console.log(`  ! merge to id=${keep.id} failed: ${error.message}`)
    }
    const { error: phErr } = await supabase.from('price_history').delete().eq('pub_id', drop.id)
    if (phErr) console.log(`  ! history delete id=${drop.id}: ${phErr.message}`)
    const { error } = await supabase.from('pubs').delete().eq('id', drop.id)
    if (error) console.log(`  ! delete id=${drop.id} failed: ${error.message}`)
    else console.log(`  ✓ merged id=${drop.id} into id=${keep.id}`)
  }
}

console.log('\nDone.')
