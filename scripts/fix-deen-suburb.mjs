#!/usr/bin/env node
/**
 * Data fix: The Deen is tagged suburb="North Perth" but its address is
 * "82 Aberdeen St, Northbridge WA" (Aberdeen St is Northbridge). Correct the
 * suburb to "Northbridge".
 *
 * The pub route (/[suburb]/[pub]) looks pubs up by slug and 301-redirects when
 * the URL suburb != the pub's canonical suburb, so /north-perth/the-deen will
 * auto-redirect to /northbridge/the-deen after this change — no code redirect
 * needed.
 *
 * Idempotent + guarded: only updates when the current suburb is exactly
 * "North Perth" and the address mentions Northbridge, so re-running is safe.
 *
 *   node scripts/fix-deen-suburb.mjs --dry-run   # show what would change
 *   node scripts/fix-deen-suburb.mjs             # apply
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY = process.argv.includes('--dry-run')
const SLUG = 'the-deen'
const FROM = 'North Perth'
const TO = 'Northbridge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data: rows, error } = await supabase
  .from('pubs')
  .select('id, name, slug, suburb, address')
  .eq('slug', SLUG)
if (error) throw error

if (!rows || rows.length === 0) {
  console.error(`No pub found with slug "${SLUG}".`)
  process.exit(1)
}
if (rows.length > 1) {
  console.error(`Expected exactly one "${SLUG}" pub, found ${rows.length}. Aborting.`)
  console.error(rows)
  process.exit(1)
}

const pub = rows[0]
console.log('Before:', JSON.stringify(pub, null, 2))

if (pub.suburb === TO) {
  console.log(`\nAlready "${TO}". Nothing to do.`)
  process.exit(0)
}
if (pub.suburb !== FROM) {
  console.error(`\nGuard failed: expected suburb "${FROM}", got "${pub.suburb}". Aborting (not touching it).`)
  process.exit(1)
}
if (!String(pub.address).toLowerCase().includes('northbridge')) {
  console.error(`\nGuard failed: address does not mention Northbridge ("${pub.address}"). Aborting.`)
  process.exit(1)
}

if (DRY) {
  console.log(`\n[dry-run] would set suburb "${FROM}" -> "${TO}" for #${pub.id} (${pub.name}).`)
  process.exit(0)
}

const { error: upErr } = await supabase.from('pubs').update({ suburb: TO }).eq('id', pub.id)
if (upErr) throw upErr

const { data: after } = await supabase
  .from('pubs')
  .select('id, name, slug, suburb, address')
  .eq('id', pub.id)
  .single()
console.log('\nAfter:', JSON.stringify(after, null, 2))
console.log(`\nDone. ${pub.name}: "${FROM}" -> "${TO}". /north-perth/the-deen now 301s to /northbridge/the-deen.`)
