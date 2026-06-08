#!/usr/bin/env node
/**
 * Merge re-curated photo picks into scripts/photo-overrides.json.
 * Reads scripts/recurated-picks.json: { "<slug>": <int index> | "NONE", ... }
 * - integer  -> store as that photo INDEX (refs rotate; array order is stable)
 * - "NONE"   -> keep hidden (no usable venue shot)
 * Existing overrides are preserved/updated, not clobbered.
 *
 * After running this, apply to the DB with:
 *   node scripts/backfill-place-attributes.mjs --overrides-only
 * (or scope to the changed slugs with --slugs a,b,c)
 */
import { readFile, writeFile } from 'fs/promises'

const picks = JSON.parse(await readFile('scripts/recurated-picks.json', 'utf8'))
const overrides = JSON.parse(await readFile('scripts/photo-overrides.json', 'utf8').catch(() => '{}'))

let toPhoto = 0
let toHidden = 0
for (const [slug, val] of Object.entries(picks)) {
  if (val === 'NONE') {
    overrides[slug] = 'NONE'
    toHidden++
  } else {
    const idx = Number(val)
    if (!Number.isInteger(idx) || idx < 0) {
      console.error(`! ${slug}: bad index ${JSON.stringify(val)} — skipped`)
      continue
    }
    overrides[slug] = idx
    toPhoto++
  }
}

await writeFile('scripts/photo-overrides.json', JSON.stringify(overrides, null, 2) + '\n')
console.log(`merged ${Object.keys(picks).length} picks: ${toPhoto} -> photo, ${toHidden} -> hidden`)
console.log(`overrides total now ${Object.keys(overrides).length}`)
