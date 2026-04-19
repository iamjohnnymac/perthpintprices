#!/usr/bin/env node
/**
 * Outbound-call orchestrator — "Rachel-for-Perth".
 *
 * Fetches pubs that have a phone number but no regular price, then fires off
 * Twilio outbound calls one at a time. Twilio calls our /api/twilio/voice
 * route for the TwiML, plays the Charlie greeting, records the bartender's
 * response, and hits /api/twilio/recording-complete to write the price.
 *
 * Usage:
 *   node scripts/call-pubs.mjs --dry-run             # list callable pubs, don't dial
 *   node scripts/call-pubs.mjs --test +61412345678   # single test call to YOUR phone
 *   node scripts/call-pubs.mjs --limit 10            # first 10 callable pubs
 *   node scripts/call-pubs.mjs                       # full sweep (~2 afternoons)
 *
 * Env (.env.local):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (+61...)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   PUBLIC_BASE_URL  override webhook base (default: https://perthpintprices.com)
 */
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const getArg = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : null
}
const TEST_NUMBER = getArg('--test')
const LIMIT = parseInt(getArg('--limit') || '0', 10) || null

const SID = process.env.TWILIO_ACCOUNT_SID
const TOK = process.env.TWILIO_AUTH_TOKEN
const FROM = process.env.TWILIO_PHONE_NUMBER
const BASE = process.env.PUBLIC_BASE_URL || 'https://perthpintprices.com'
if (!SID || !TOK || !FROM) {
  console.error('Missing Twilio env vars (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER)')
  process.exit(1)
}

const client = twilio(SID, TOK)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Normalise assorted Aussie phone formats to E.164 (+61...).
function toE164(raw) {
  if (!raw) return null
  let n = String(raw).replace(/[^\d+]/g, '')
  if (n.startsWith('+')) return n
  if (n.startsWith('61')) return '+' + n
  if (n.startsWith('0')) return '+61' + n.slice(1)
  if (n.startsWith('4') || n.startsWith('8') || n.startsWith('9')) return '+61' + n
  return null
}

async function placeCall(toE164Num, pubId, pubName) {
  const url = `${BASE}/api/twilio/voice?pubId=${encodeURIComponent(pubId)}`
  const call = await client.calls.create({
    to: toE164Num,
    from: FROM,
    url,
    method: 'POST',
    // 20s rings is plenty — if no one's by the phone, skip.
    timeout: 20,
    machineDetection: 'Enable',
    machineDetectionTimeout: 5,
  })
  return call
}

async function main() {
  if (TEST_NUMBER) {
    const to = toE164(TEST_NUMBER)
    if (!to) {
      console.error('Could not parse test number:', TEST_NUMBER)
      process.exit(1)
    }
    console.log(`TEST CALL → ${to} (webhook base: ${BASE})`)
    if (DRY) {
      console.log('(dry run — not dialling)')
      return
    }
    const call = await placeCall(to, 'test', 'TEST')
    console.log(`Placed. SID=${call.sid} Status=${call.status}`)
    return
  }

  // Find pubs with phone + no price. Prefer those with a Google place_id
  // (we're more confident they're real, operating venues).
  const { data: pubs, error } = await supabase
    .from('pubs')
    .select('id, name, suburb, phone, price, place_id')
    .is('price', null)
    .not('phone', 'is', null)
    .order('id')

  if (error) throw error

  const callable = []
  for (const p of pubs) {
    const e164 = toE164(p.phone)
    if (e164) callable.push({ ...p, e164 })
  }

  console.log(`${pubs.length} pubs with phone + no price`)
  console.log(`${callable.length} have parseable phone numbers`)

  const subset = LIMIT ? callable.slice(0, LIMIT) : callable
  console.log(`\nWill call ${subset.length} pubs at 1 per 20s (est ${Math.ceil((subset.length * 20) / 60)} min)\n`)

  if (DRY) {
    for (const p of subset.slice(0, 20)) {
      console.log(`  ${p.name.padEnd(40)} ${p.suburb.padEnd(20)} ${p.e164}`)
    }
    if (subset.length > 20) console.log(`  ... and ${subset.length - 20} more`)
    console.log('\n(dry run — not dialling)')
    return
  }

  let placed = 0
  let failed = 0
  for (let i = 0; i < subset.length; i++) {
    const p = subset[i]
    process.stdout.write(`[${i + 1}/${subset.length}] ${p.name} (${p.suburb}) ${p.e164}... `)
    try {
      const call = await placeCall(p.e164, p.id, p.name)
      console.log(`SID=${call.sid}`)
      placed++
    } catch (e) {
      console.log(`FAIL: ${e.message}`)
      failed++
    }
    // 20s spacing — polite to pubs, avoids concurrent-call limits
    if (i < subset.length - 1) await new Promise((r) => setTimeout(r, 20000))
  }

  console.log(`\nDone. Placed ${placed}, failed ${failed}. Check /api/twilio/recording-complete logs for results.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
