#!/usr/bin/env node
/**
 * Flag a pub as "do not call" so the phone-agent sweep skips it permanently.
 * Inserts a sentinel row into phone_call_log with parsed_confidence='do_not_call';
 * the kickoff route excludes any pub_id with that marker.
 *
 * Usage:
 *   node scripts/mark-dnc.mjs --slug <pub-slug> [--reason "asked not to call back"]
 *   node scripts/mark-dnc.mjs --slug <pub-slug> --undo
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = process.argv.slice(2)

function arg(flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : null
}

const slug = arg('--slug')
const reason = arg('--reason') || 'manual DNC'
const undo = args.includes('--undo')

if (!slug) {
  console.error('Usage: node scripts/mark-dnc.mjs --slug <pub-slug> [--reason "..."] [--undo]')
  process.exit(1)
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  serviceKey,
  { auth: { persistSession: false } },
)

const { data: pub, error: fetchErr } = await supabase
  .from('pubs')
  .select('id, name, slug')
  .eq('slug', slug)
  .single()

if (fetchErr || !pub) {
  console.error(`No pub found with slug "${slug}"`)
  process.exit(1)
}

if (undo) {
  const { error, count } = await supabase
    .from('phone_call_log')
    .delete({ count: 'exact' })
    .eq('pub_id', pub.id)
    .eq('parsed_confidence', 'do_not_call')

  if (error) {
    console.error('Delete failed:', error.message)
    process.exit(1)
  }

  console.log(`Cleared DNC for ${pub.name} (${count ?? 0} rows removed)`)
  process.exit(0)
}

const { error: insertErr } = await supabase.from('phone_call_log').insert({
  pub_id: pub.id,
  call_sid: `manual-dnc-${Date.now()}`,
  transcript: null,
  recording_url: null,
  parsed_price: null,
  parsed_beer_type: null,
  parsed_confidence: 'do_not_call',
  parsed_notes: reason,
})

if (insertErr) {
  console.error('Insert failed:', insertErr.message)
  process.exit(1)
}

console.log(`Marked ${pub.name} (id=${pub.id}) as do_not_call: "${reason}"`)
