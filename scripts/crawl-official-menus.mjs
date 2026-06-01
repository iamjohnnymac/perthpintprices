#!/usr/bin/env node
/**
 * Crawl a curated list of official menu URLs and create pending price reports.
 *
 * Default mode is dry-run. Copy scripts/official-menu-seeds.example.json to a
 * local seed file, add reviewed official URLs, then run:
 *
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json --write
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { config } from 'dotenv'

import { extractOfficialMenuCandidates } from '../src/lib/officialMenuExtract.ts'

config({ path: '.env.local' })

const EXTRACTOR_VERSION = 'official-menu-crawler-v1'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
const args = process.argv.slice(2)
const shouldWrite = args.includes('--write')
const dryRun = !shouldWrite
const seedFile = arg('--file') || 'scripts/official-menu-seeds.json'
const limit = Number.parseInt(arg('--limit') || '0', 10) || null

if (!existsSync(seedFile)) {
  console.error(`Seed file not found: ${seedFile}`)
  console.error('Copy scripts/official-menu-seeds.example.json and add reviewed official menu URLs.')
  process.exit(1)
}

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (shouldWrite && !serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required when using --write')
  process.exit(1)
}

const supabase = createClient(
  SUPABASE_URL,
  serviceKey || SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
)

const sources = loadSources(seedFile)
const selectedSources = limit ? sources.slice(0, limit) : sources
console.log(`${selectedSources.length} official menu source${selectedSources.length === 1 ? '' : 's'}`)
console.log(dryRun ? 'Mode: dry run (no writes)\n' : 'Mode: write pending price_reports\n')

let fetched = 0
let inserted = 0
let found = 0
let failed = 0

for (const source of selectedSources) {
  process.stdout.write(`${source.pub_slug} ${source.url} ... `)

  try {
    const { data: pub, error: pubErr } = await supabase
      .from('pubs')
      .select('id, slug, name')
      .eq('slug', source.pub_slug)
      .single()

    if (pubErr || !pub) {
      failed++
      console.log(`no pub found`)
      continue
    }

    const html = await fetchText(source.url)
    fetched++
    const candidates = extractOfficialMenuCandidates(html, source.max_candidates || 5)
    found += candidates.length
    console.log(`${candidates.length} candidate${candidates.length === 1 ? '' : 's'}`)

    for (const candidate of candidates) {
      console.log(`  - $${candidate.price.toFixed(2)} ${candidate.beerType || 'pint'} (${candidate.evidenceText})`)
    }

    if (!dryRun && candidates.length > 0) {
      const observedAt = new Date().toISOString()
      const rows = candidates.map((candidate) => ({
        pub_slug: pub.slug,
        reported_price: candidate.price,
        beer_type: candidate.beerType,
        reporter_name: 'Official menu crawler',
        report_type: 'price_report',
        notes: source.label ? `Official menu crawl: ${source.label}` : 'Official menu crawl',
        submission_source: 'official_menu',
        source_url: source.url,
        evidence_text: candidate.evidenceText,
        observed_at: observedAt,
        raw_extraction: {
          source,
          candidate,
        },
        extractor_version: EXTRACTOR_VERSION,
      }))

      const { error: insertErr } = await supabase.from('price_reports').insert(rows)
      if (insertErr) {
        failed++
        console.log(`  ! insert failed: ${insertErr.message}`)
      } else {
        inserted += rows.length
      }
    }
  } catch (err) {
    failed++
    console.log(`error: ${err instanceof Error ? err.message : String(err)}`)
  }

  await sleep(150)
}

console.log('\n=== Official menu crawl summary ===')
console.log(`Fetched: ${fetched}`)
console.log(`Candidates found: ${found}`)
console.log(`Inserted pending reports: ${inserted}`)
console.log(`Failed sources: ${failed}`)
console.log(dryRun ? '(dry run - no writes)' : 'Write complete')

function arg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : null
}

function loadSources(path) {
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(parsed.sources)) {
    throw new Error(`${path} must contain a "sources" array`)
  }

  return parsed.sources.map((source, index) => {
    if (!source.pub_slug || !source.url) {
      throw new Error(`sources[${index}] must include pub_slug and url`)
    }
    new URL(source.url)
    return source
  })
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
