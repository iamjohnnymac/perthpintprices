#!/usr/bin/env node
/**
 * Fetch Google photo candidates for specific pub slugs so a better venue shot can
 * be hand-picked. Downloads to .photo-candidates/<slug>/NN.jpg and PRINTS each
 * candidate's NN + stable ref (paste the chosen ref into scripts/photo-overrides.json,
 * then apply with: node scripts/backfill-place-attributes.mjs --photos-only --slugs <slug>).
 *   node scripts/repick-photos.mjs --slugs the-bird,charles-hotel
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { mkdir, writeFile, rm } from 'fs/promises'

config({ path: '.env.local' })
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY
const MAX = 10

const a = process.argv.indexOf('--slugs')
const SLUGS = a !== -1 && process.argv[a + 1] ? process.argv[a + 1].split(',').map((s) => s.trim()).filter(Boolean) : []
if (!SLUGS.length) { console.error('usage: node scripts/repick-photos.mjs --slugs slug1,slug2'); process.exit(1) }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data, error } = await supabase.from('pubs').select('slug,name,suburb,place_id').in('slug', SLUGS)
if (error) throw error
await mkdir('.photo-candidates', { recursive: true })

for (const pub of data) {
  if (!pub.place_id) { console.log(`! ${pub.slug}: no place_id`); continue }
  await rm(`.photo-candidates/${pub.slug}`, { recursive: true, force: true })
  await mkdir(`.photo-candidates/${pub.slug}`, { recursive: true })
  const res = await fetch(`https://places.googleapis.com/v1/places/${pub.place_id}`, {
    headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'photos' },
  })
  if (!res.ok) { console.log(`! ${pub.name}: details HTTP ${res.status}`); continue }
  const json = await res.json()
  const photos = (json.photos || []).slice(0, MAX)
  console.log(`\n=== ${pub.name} (${pub.slug}) ===`)
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
      await writeFile(`.photo-candidates/${pub.slug}/${String(ci).padStart(2, '0')}.jpg`, Buffer.from(await img.arrayBuffer()))
      console.log(`${String(ci).padStart(2, '0')}  ${ref}`)
      ci++
    } catch { /* skip */ }
  }
  console.log(`(${ci} candidates)`)
}
console.log('\ndone')
