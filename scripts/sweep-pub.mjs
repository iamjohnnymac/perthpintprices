#!/usr/bin/env node
// Trigger Andrew (the ElevenLabs voice agent) to call a Perth pub and ask their pint prices.
// Reads pub_name, suburb, slug, phone from Supabase and passes them as dynamic_variables so
// the agent's first message renders correctly ("Hi, is this {{pub_name}}?").
//
// Usage:
//   ELEVENLABS_API_KEY=xxx node scripts/sweep-pub.mjs <pub_slug>          # call one pub
//   ELEVENLABS_API_KEY=xxx node scripts/sweep-pub.mjs --batch=5           # call 5 pubs missing prices
//   ELEVENLABS_API_KEY=xxx node scripts/sweep-pub.mjs --batch=5 --dry-run # preview only

import { createClient } from '@supabase/supabase-js'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const dryRun = process.argv.includes('--dry-run')
if (!ELEVENLABS_API_KEY && !dryRun) {
  console.error('ELEVENLABS_API_KEY env var is required (or pass --dry-run to preview without calling)')
  process.exit(1)
}

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'agent_1901kpm9tjjsf6m9d03wfmjp3at4'
const AGENT_PHONE_NUMBER_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID || 'phnum_1601kpmd88gjes2sd1vtqawn0b25'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

function toE164AU(raw) {
  if (!raw) return null
  const p = String(raw).replace(/[^\d+]/g, '')
  if (p.startsWith('+')) return p
  if (p.startsWith('61')) return `+${p}`
  if (p.startsWith('0')) return `+61${p.slice(1)}`
  // bare 8-digit Perth landline ("84321234") — assume +61 8
  if (/^[1-9]\d{7}$/.test(p)) return `+61${p}`
  return null
}

async function callPub(pub) {
  const to = toE164AU(pub.phone)
  if (!to) {
    console.warn(`skip ${pub.slug}: phone "${pub.phone}" not parseable as AU number`)
    return { skipped: true, reason: 'no_phone' }
  }

  const payload = {
    agent_id: AGENT_ID,
    agent_phone_number_id: AGENT_PHONE_NUMBER_ID,
    to_number: to,
    conversation_initiation_client_data: {
      dynamic_variables: {
        pub_name: pub.name,
        suburb: pub.suburb,
        pub_slug: pub.slug,
      },
    },
  }

  const res = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`✗ ${pub.slug}: HTTP ${res.status}`, json)
    return { ok: false, status: res.status, error: json }
  }
  console.log(`✓ ${pub.name} (${pub.slug}) → ${to}  conv=${json.conversation_id}  callsid=${json.callsid}`)
  return { ok: true, conversation_id: json.conversation_id, callsid: json.callsid }
}

async function main() {
  const args = process.argv.slice(2)
  const batchArg = args.find((a) => a.startsWith('--batch='))

  let pubs = []
  if (batchArg) {
    const limit = parseInt(batchArg.split('=')[1], 10) || 5
    const { data, error } = await supabase
      .from('pubs')
      .select('id, slug, name, suburb, phone, price')
      .is('price', null)
      .not('phone', 'is', null)
      .order('name', { ascending: true })
      .limit(limit)
    if (error) {
      console.error('supabase error:', error)
      process.exit(1)
    }
    pubs = data || []
  } else {
    const slug = args.find((a) => !a.startsWith('--'))
    if (!slug) {
      console.error('Usage: sweep-pub.mjs <slug> | --batch=N [--dry-run]')
      process.exit(1)
    }
    const { data, error } = await supabase
      .from('pubs')
      .select('id, slug, name, suburb, phone, price')
      .eq('slug', slug)
      .maybeSingle()
    if (error) {
      console.error('supabase error:', error)
      process.exit(1)
    }
    if (!data) {
      console.error(`no pub with slug "${slug}"`)
      process.exit(1)
    }
    pubs = [data]
  }

  console.log(`pubs to call: ${pubs.length}${dryRun ? ' (DRY RUN — no calls placed)' : ''}`)
  for (const p of pubs) {
    if (dryRun) {
      console.log(`  ${p.slug.padEnd(40)} ${(p.name || '').padEnd(35)} ${p.suburb.padEnd(20)} ${p.phone || '—'} → ${toE164AU(p.phone) || '—'}`)
      continue
    }
    await callPub(p)
    // small jitter so we don't slam Twilio when batching
    await new Promise((r) => setTimeout(r, 1500))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
