#!/usr/bin/env node
/**
 * Hide the agent-flagged bad long-tail photos: nulls google_photo_url for each
 * flagged pub and records slug -> "NONE" in scripts/photo-overrides.json so the
 * monthly refresh keeps them hidden. BAD = positions in the same name-ordered,
 * non-happy-hour, has-photo set as download-review-photos.mjs --exclude-happy-hour.
 *   node scripts/hide-bad-photos.mjs --dry-run   # print, no writes
 *   node scripts/hide-bad-photos.mjs             # null + write overrides
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFile, writeFile } from 'fs/promises'

config({ path: '.env.local' })
const DRY = process.argv.includes('--dry-run')

const BAD = [
  1,6,8,14,15,17,18,24,32,38,39,42,44,46,48,51,54,55,58,59,60,
  72,78,81,82,91,95,97,98,103,105,111,116,118,120,121,122,124,127,
  129,142,143,147,149,150,153,157,159,161,162,165,167,170,171,174,175,176,177,178,179,185,186,
  199,206,209,212,219,220,221,223,224,228,233,234,240,245,246,254,
  256,259,260,261,263,264,267,268,269,271,272,275,279,286,287,290,292,295,297,298,301,303,308,311,312,314,315,
  320,321,326,327,328,329,344,345,348,351,355,359,365,370,382,383,
  386,389,392,393,397,400,406,408,409,411,413,414,415,418,420,428,429,432,434,436,442,445,446,
  448,450,454,456,468,469,475,479,481,483,485,489,490,493,500,504,507,511,
  520,528,548,552,562,565,567,568,572,
  576,579,588,594,598,612,613,616,617,620,621,623,624,635,636,
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// SAME query + order as download-review-photos.mjs --exclude-happy-hour.
const { data, error } = await supabase
  .from('pubs')
  .select('id,slug,name,google_photo_url')
  .not('google_photo_url', 'is', null)
  .is('happy_hour', null)
  .order('name')
if (error) throw error
console.log(`long-tail set: ${data.length} pubs`)

const overrides = JSON.parse(await readFile('scripts/photo-overrides.json', 'utf8').catch(() => '{}'))
let hidden = 0
const sample = []
for (const idx of BAD) {
  const pub = data[idx]
  if (!pub) { console.log(`! idx ${idx}: no pub`); continue }
  overrides[pub.slug] = 'NONE'
  if (sample.length < 12) sample.push(`${idx}:${pub.name}`)
  if (!DRY) {
    const { error: e } = await supabase
      .from('pubs')
      .update({ google_photo_url: null, google_photo_attribution: null, google_photo_attribution_uri: null })
      .eq('id', pub.id)
    if (e) { console.log(`! ${pub.name}: ${e.message}`); continue }
  }
  hidden++
}
if (!DRY) await writeFile('scripts/photo-overrides.json', JSON.stringify(overrides, null, 2) + '\n')
console.log(`\n${DRY ? '[dry] would hide' : 'hidden'} ${hidden} pubs; overrides total now ${Object.keys(overrides).length}`)
console.log('sample: ' + sample.join('  |  '))
