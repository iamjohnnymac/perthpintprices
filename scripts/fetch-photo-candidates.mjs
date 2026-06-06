#!/usr/bin/env node
/**
 * Throwaway curation helper: for the weak-photo pubs (BAD_INDICES, positions in the
 * same name-ordered happy-hour set as download-review-photos.mjs), downloads up to
 * MAX_CANDIDATES Google photo candidates each into .photo-candidates/<slug>/NN.jpg
 * and records the stable photo ref per candidate, so agents can view them and pick a
 * real venue shot. Writes .photo-candidates/manifest.tsv (slug, NN, ref, name, suburb).
 * Safe to delete.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { mkdir, writeFile, rm } from 'fs/promises'

config({ path: '.env.local' })

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
const MAX_CANDIDATES = 8
// Positions (0-based) in the name-ordered happy-hour set flagged BAD by the review.
const BAD_INDICES = [1,2,3,4,6,12,13,14,17,21,24,26,31,35,36,40,41,44,48,51,52,53,57,58,60,64,65,69,74,76,77,78,81,83,87,90,96,97,99,102,104,105,108,116,117,120,127,128,130,132,133]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// SAME query + order as download-review-photos.mjs --happy-hour so positions align.
const { data, error } = await supabase
  .from('pubs')
  .select('slug,name,suburb,place_id,google_photo_url')
  .not('google_photo_url', 'is', null)
  .not('happy_hour', 'is', null)
  .order('name')
if (error) throw error

await rm('.photo-candidates', { recursive: true, force: true })
await mkdir('.photo-candidates', { recursive: true })

const manifest = []
for (const idx of BAD_INDICES) {
  const pub = data[idx]
  if (!pub?.place_id) { console.log(`! idx ${idx}: no pub/place_id`); continue }
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${pub.place_id}`, {
      headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'photos' },
    })
    if (!res.ok) { console.log(`! ${pub.name}: details HTTP ${res.status}`); continue }
    const json = await res.json()
    const photos = (json.photos || []).slice(0, MAX_CANDIDATES)
    await mkdir(`.photo-candidates/${pub.slug}`, { recursive: true })
    let ci = 0
    for (const ph of photos) {
      const ref = (ph.name || '').split('/photos/')[1] || ''
      try {
        const m = await fetch(`https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=800&skipHttpRedirect=true`, {
          headers: { 'X-Goog-Api-Key': GOOGLE_KEY },
        })
        if (!m.ok) continue
        const mj = await m.json()
        if (!mj.photoUri) continue
        const img = await fetch(mj.photoUri)
        if (!img.ok) continue
        const buf = Buffer.from(await img.arrayBuffer())
        const nn = String(ci).padStart(2, '0')
        await writeFile(`.photo-candidates/${pub.slug}/${nn}.jpg`, buf)
        manifest.push(`${pub.slug}\t${nn}\t${ref}\t${pub.name}\t${pub.suburb}`)
        ci++
      } catch { /* skip candidate */ }
    }
    console.log(`${pub.name} (${pub.slug}): ${ci} candidates`)
  } catch (e) { console.log(`! ${pub.name}: ${e.message}`) }
}
await writeFile('.photo-candidates/manifest.tsv', manifest.join('\n'))
console.log(`\ndone — ${manifest.length} candidate images across ${BAD_INDICES.length} pubs`)
