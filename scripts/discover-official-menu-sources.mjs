#!/usr/bin/env node
/**
 * Discover likely official menu/drinks sources for pubs with websites.
 *
 * Read-only: this writes a local JSON review artifact and does not insert
 * price_reports or update pubs.
 *
 * Usage:
 *   npm run discover:official-menu-sources -- --limit 25
 *   npm run discover:official-menu-sources -- --include-priced --output /tmp/sources.json
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

import { discoverOfficialMenuSources } from '../src/lib/officialMenuSources.ts'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'

const args = process.argv.slice(2)
const limit = Number.parseInt(arg('--limit') || '50', 10)
const includePriced = args.includes('--include-priced')
const output = arg('--output') || 'scripts/official-menu-source-candidates.json'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

let query = supabase
  .from('pubs')
  .select('id, slug, name, suburb, price, website')
  .not('website', 'is', null)
  .neq('website', '')
  .order('last_verified', { ascending: true, nullsFirst: true })
  .limit(limit)

if (!includePriced) {
  query = query.or('price.is.null,price.eq.0')
}

const { data: pubs, error } = await query
if (error) throw error

console.log(`${pubs.length} pub website${pubs.length === 1 ? '' : 's'} to inspect`)
console.log(includePriced ? 'Scope: all pubs with websites' : 'Scope: missing regular prices only')
console.log(`Output: ${output}\n`)

const results = []
let fetched = 0
let failed = 0
let candidateCount = 0

for (let i = 0; i < pubs.length; i++) {
  const pub = pubs[i]
  process.stdout.write(`[${i + 1}/${pubs.length}] ${pub.name} ... `)

  try {
    const html = await fetchText(pub.website)
    const candidates = discoverOfficialMenuSources(html, pub.website, 5)
    fetched++
    candidateCount += candidates.length
    results.push({
      pub_slug: pub.slug,
      pub_name: pub.name,
      suburb: pub.suburb,
      website: pub.website,
      candidate_count: candidates.length,
      candidates,
    })
    console.log(`${candidates.length} candidate${candidates.length === 1 ? '' : 's'}`)
  } catch (err) {
    failed++
    results.push({
      pub_slug: pub.slug,
      pub_name: pub.name,
      suburb: pub.suburb,
      website: pub.website,
      error: err instanceof Error ? err.message : String(err),
      candidates: [],
    })
    console.log(`error: ${err instanceof Error ? err.message : String(err)}`)
  }

  await sleep(150)
}

const artifact = {
  generated_at: new Date().toISOString(),
  scope: includePriced ? 'all_with_websites' : 'missing_regular_prices_with_websites',
  summary: {
    inspected: pubs.length,
    fetched,
    failed,
    candidate_count: candidateCount,
  },
  results,
}

writeFileSync(output, JSON.stringify(artifact, null, 2))

console.log('\n=== Official menu source discovery ===')
console.log(`Fetched: ${fetched}`)
console.log(`Failed: ${failed}`)
console.log(`Candidates: ${candidateCount}`)
console.log(`Written: ${output}`)

function arg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : null
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'PerthPintPricesBot/1.0 (+https://perthpintprices.com)',
      accept: 'text/html, text/plain;q=0.9, */*;q=0.5',
    },
    signal: AbortSignal.timeout(12000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.text()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
