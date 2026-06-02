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
 *   npm run discover:official-menu-sources -- --limit 100 --render-all
 *   npm run discover:official-menu-sources -- --limit 200 --seed-output /tmp/seeds.json
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
const perPubLimit = Number.parseInt(arg('--per-pub-limit') || '5', 10)
const includePriced = args.includes('--include-priced')
const renderEnabled = !args.includes('--no-render')
const renderAll = args.includes('--render-all')
const output = arg('--output') || 'scripts/official-menu-source-candidates.json'
const seedOutput = arg('--seed-output')
let renderBrowser = null

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
console.log(`Rendered homepage fallback: ${renderEnabled ? (renderAll ? 'all fetched sites' : 'zero-candidate sites only') : 'disabled'}`)
console.log(`Output: ${output}\n`)
if (seedOutput) console.log(`Seed output: ${seedOutput}\n`)

const results = []
let fetched = 0
let failed = 0
let candidateCount = 0

for (let i = 0; i < pubs.length; i++) {
  const pub = pubs[i]
  process.stdout.write(`[${i + 1}/${pubs.length}] ${pub.name} ... `)

  try {
    const html = await fetchText(pub.website)
    let candidates = discoverOfficialMenuSources(html, pub.website, perPubLimit)
    const discoveryModes = ['raw-html']
    let renderError = null

    if (renderEnabled && (renderAll || candidates.length === 0)) {
      const renderResult = await renderHtml(pub.website)
      if (renderResult.error) {
        renderError = renderResult.error
      }
      if (renderResult.html) {
        discoveryModes.push('rendered-html')
        candidates = mergeCandidates(
          candidates,
          discoverOfficialMenuSources(renderResult.html, pub.website, perPubLimit),
          perPubLimit,
        )
      }
    }

    fetched++
    candidateCount += candidates.length
    results.push({
      pub_slug: pub.slug,
      pub_name: pub.name,
      suburb: pub.suburb,
      website: pub.website,
      candidate_count: candidates.length,
      discovery_modes: discoveryModes,
      ...(renderError ? { render_error: renderError } : {}),
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

if (seedOutput) {
  const seedArtifact = {
    generated_at: artifact.generated_at,
    source_artifact: output,
    sources: results.flatMap((result) =>
      result.candidates.map((candidate) => ({
        pub_slug: result.pub_slug,
        url: candidate.url,
        label: candidate.label || `discovered ${candidate.type} menu source`,
        source_score: candidate.score,
        source_reasons: candidate.reasons,
      })),
    ),
  }

  writeFileSync(seedOutput, JSON.stringify(seedArtifact, null, 2))
}

await closeRenderBrowser()

console.log('\n=== Official menu source discovery ===')
console.log(`Fetched: ${fetched}`)
console.log(`Failed: ${failed}`)
console.log(`Candidates: ${candidateCount}`)
console.log(`Written: ${output}`)
if (seedOutput) console.log(`Seed written: ${seedOutput}`)

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

async function renderHtml(url) {
  let page = null

  try {
    const { chromium } = await import('playwright')
    renderBrowser ||= await chromium.launch({ headless: true })
    page = await renderBrowser.newPage({
      userAgent: 'PerthPintPricesBot/1.0 (+https://perthpintprices.com)',
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    return { html: await page.content(), error: null }
  } catch (err) {
    return { html: '', error: err instanceof Error ? err.message : String(err) }
  } finally {
    if (page && !page.isClosed()) await page.close().catch(() => {})
  }
}

async function closeRenderBrowser() {
  if (!renderBrowser) return
  await renderBrowser.close()
  renderBrowser = null
}

function mergeCandidates(existing, next, limit) {
  const byUrl = new Map()

  for (const candidate of [...existing, ...next]) {
    const key = canonicalSourceKey(candidate.url)
    const current = byUrl.get(key)
    if (!current || candidate.score > current.score) byUrl.set(key, candidate)
  }

  return Array.from(byUrl.values())
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, limit)
}

function canonicalSourceKey(url) {
  const parsed = new URL(url)
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  }
  return parsed.toString()
}
