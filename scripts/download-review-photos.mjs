#!/usr/bin/env node
/**
 * Throwaway photo-review helper: downloads the current Google photo for each pub
 * (optionally --happy-hour) into .photo-review/ as zero-padded NNN.jpg + a manifest,
 * so they can be montaged into contact sheets for a human/AI quality pass.
 * Not wired into the app. Safe to delete.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { mkdir, writeFile, rm } from 'fs/promises'

config({ path: '.env.local' })

const HAPPY_HOUR_ONLY = process.argv.includes('--happy-hour')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

let q = supabase
  .from('pubs')
  .select('slug,name,suburb,google_photo_url,google_photo_attribution')
  .not('google_photo_url', 'is', null)
if (HAPPY_HOUR_ONLY) q = q.not('happy_hour', 'is', null)
q = q.order('name')

const { data, error } = await q
if (error) throw error

await rm('.photo-review', { recursive: true, force: true })
await mkdir('.photo-review', { recursive: true })

const manifest = []
let i = 0
for (const p of data) {
  const idx = String(i).padStart(3, '0')
  try {
    const res = await fetch(p.google_photo_url)
    if (!res.ok) { console.log(`! ${p.name}: HTTP ${res.status}`); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(`.photo-review/${idx}.jpg`, buf)
    manifest.push(`${idx}\t${p.name}\t${p.suburb}\t${p.google_photo_attribution || ''}`)
    i++
  } catch (e) { console.log(`! ${p.name}: ${e.message}`) }
}
await writeFile('.photo-review/manifest.tsv', manifest.join('\n'))
console.log(`downloaded ${i} photos to .photo-review/`)
