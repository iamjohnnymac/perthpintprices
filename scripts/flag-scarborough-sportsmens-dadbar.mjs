#!/usr/bin/env node
/**
 * Add Scarborough Sportsmens Club (pub #135) to the Dad Bar by setting the
 * hand-curated kid_friendly flag. It has lawn bowls + a verified $10 pint, so
 * isDadBar() (kid_friendly OR Google-good-for-children) then includes it.
 *
 * Idempotent + guarded: only flips the row when it's the expected venue and
 * still false, so re-running is safe.
 *
 *   node scripts/flag-scarborough-sportsmens-dadbar.mjs --dry-run
 *   node scripts/flag-scarborough-sportsmens-dadbar.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY = process.argv.includes('--dry-run')
const ID = 135
const NAME_MUST_INCLUDE = 'Sportsmens'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: pub, error } = await supabase
  .from('pubs')
  .select('id, name, slug, suburb, price, price_verified, kid_friendly')
  .eq('id', ID)
  .single()
if (error) throw error

console.log('Target:', JSON.stringify(pub, null, 2))

if (!String(pub.name).includes(NAME_MUST_INCLUDE)) {
  console.error(`\nGuard failed: #${ID} name "${pub.name}" doesn't include "${NAME_MUST_INCLUDE}". Aborting.`)
  process.exit(1)
}
if (!(pub.price != null && Number(pub.price) > 0 && pub.price_verified)) {
  console.error(`\nGuard failed: #${ID} has no verified price ($${pub.price}, verified=${pub.price_verified}) — it won't show in the Dad Bar without one. Aborting.`)
  process.exit(1)
}
if (pub.kid_friendly === true) {
  console.log('\nAlready kid_friendly. Nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`\n[dry-run] would set kid_friendly = true for #${ID} (${pub.name}).`)
  process.exit(0)
}

const { error: upErr } = await supabase.from('pubs').update({ kid_friendly: true }).eq('id', ID)
if (upErr) throw upErr

const { data: after } = await supabase
  .from('pubs')
  .select('id, name, suburb, price, kid_friendly')
  .eq('id', ID)
  .single()
console.log('\nAfter:', JSON.stringify(after, null, 2))
console.log(`\nDone. ${after.name} is now in the Dad Bar (kid_friendly = true).`)
