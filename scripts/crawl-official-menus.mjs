#!/usr/bin/env node
/**
 * Crawl a curated list of official menu URLs and create pending price reports.
 *
 * Default mode is dry-run. Copy scripts/official-menu-seeds.example.json to a
 * local seed file, add reviewed official URLs, then run:
 *
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json --output /tmp/menu-crawl.json
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json --render-all
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json --follow-links
 *   npm run crawl:official-menus -- --file scripts/official-menu-seeds.json --write
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { config } from 'dotenv'

import { extractOfficialMenuCandidates } from '../src/lib/officialMenuExtract.ts'
import { discoverOfficialMenuSources } from '../src/lib/officialMenuSources.ts'

config({ path: '.env.local' })

const EXTRACTOR_VERSION = 'official-menu-crawler-v1'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
const args = process.argv.slice(2)
const shouldWrite = args.includes('--write')
const dryRun = !shouldWrite
const renderEnabled = !args.includes('--no-render')
const renderAll = args.includes('--render-all')
const ocrEnabled = !args.includes('--no-ocr')
const pdfOcrEnabled = ocrEnabled && !args.includes('--no-pdf-ocr')
const followLinks = args.includes('--follow-links')
const linkedSourceLimit = Number.parseInt(arg('--linked-source-limit') || '3', 10)
const seedFile = arg('--file') || 'scripts/official-menu-seeds.json'
const output = arg('--output') || 'scripts/official-menu-crawl-results.json'
const limit = Number.parseInt(arg('--limit') || '0', 10) || null
let ocrWorker = null
let renderBrowser = null

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
console.log(`Rendered HTML fallback: ${renderEnabled ? (renderAll ? 'all HTML sources' : 'zero-candidate HTML only') : 'disabled'}`)
console.log(`Image OCR: ${ocrEnabled ? 'enabled' : 'disabled'}`)
console.log(`Scanned PDF OCR fallback: ${pdfOcrEnabled ? 'enabled' : 'disabled'}`)
console.log(`Linked source crawl: ${followLinks ? `enabled (${linkedSourceLimit} per HTML source)` : 'disabled'}`)
console.log(`Output: ${output}\n`)

let fetched = 0
let linkedFetched = 0
let linkedFailed = 0
let inserted = 0
let found = 0
let failed = 0
const results = []

for (const source of selectedSources) {
  process.stdout.write(`${source.pub_slug} ${source.url} ... `)
  const result = {
    pub_slug: source.pub_slug,
    url: source.url,
    label: source.label || null,
    candidates: [],
  }

  try {
    const { data: pub, error: pubErr } = await supabase
      .from('pubs')
      .select('id, slug, name')
      .eq('slug', source.pub_slug)
      .single()

    if (pubErr || !pub) {
      failed++
      result.error = 'no pub found'
      console.log(`no pub found`)
      results.push(result)
      continue
    }

    const maxCandidates = source.max_candidates || 5
    const extraction = await extractFromSource(source.url, maxCandidates)
    fetched++
    result.content_type = extraction.sourceText.contentType || null
    result.source_kind = extraction.sourceText.kind
    result.extraction_modes = extraction.extractionModes
    if (extraction.renderError) result.render_error = extraction.renderError

    let candidates = withCandidateSource(
      extraction.candidates,
      source.url,
      extraction.sourceText.kind,
      extraction.extractionModes,
    )

    if (followLinks && extraction.sourceText.kind === 'html') {
      const linkedSources = discoverLinkedSources(extraction, source.url, linkedSourceLimit)
      result.linked_sources = []

      for (const linkedSource of linkedSources) {
        const linkedResult = {
          url: linkedSource.url,
          label: linkedSource.label,
          type: linkedSource.type,
          score: linkedSource.score,
          reasons: linkedSource.reasons,
          candidates: [],
        }

        try {
          const linkedExtraction = await extractFromSource(linkedSource.url, maxCandidates)
          linkedFetched++
          linkedResult.content_type = linkedExtraction.sourceText.contentType || null
          linkedResult.source_kind = linkedExtraction.sourceText.kind
          linkedResult.extraction_modes = linkedExtraction.extractionModes
          if (linkedExtraction.renderError) linkedResult.render_error = linkedExtraction.renderError
          const linkedCandidates = withCandidateSource(
            linkedExtraction.candidates,
            linkedSource.url,
            linkedExtraction.sourceText.kind,
            linkedExtraction.extractionModes,
          )
          linkedResult.candidates = linkedCandidates
          candidates = mergeCandidates(candidates, linkedCandidates, maxCandidates)
        } catch (linkedErr) {
          linkedFailed++
          linkedResult.error = linkedErr instanceof Error ? linkedErr.message : String(linkedErr)
        }

        result.linked_sources.push(linkedResult)
        await sleep(100)
      }
    }

    result.pub_name = pub.name
    result.candidates = candidates
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
        result.error = `insert failed: ${insertErr.message}`
        console.log(`  ! insert failed: ${insertErr.message}`)
      } else {
        inserted += rows.length
        result.inserted = rows.length
      }
    }
  } catch (err) {
    failed++
    result.error = err instanceof Error ? err.message : String(err)
    console.log(`error: ${err instanceof Error ? err.message : String(err)}`)
  }

  results.push(result)
  await sleep(150)
}

const artifact = {
  generated_at: new Date().toISOString(),
  mode: dryRun ? 'dry_run' : 'write',
  seed_file: seedFile,
  summary: {
    sources: selectedSources.length,
    fetched,
    linked_fetched: linkedFetched,
    linked_failed: linkedFailed,
    candidate_count: found,
    inserted,
    failed,
  },
  results,
}

writeFileSync(output, JSON.stringify(artifact, null, 2))

await closeRenderBrowser()
await closeOcrWorker()

console.log('\n=== Official menu crawl summary ===')
console.log(`Fetched: ${fetched}`)
console.log(`Linked fetched: ${linkedFetched}`)
console.log(`Linked failed: ${linkedFailed}`)
console.log(`Candidates found: ${found}`)
console.log(`Inserted pending reports: ${inserted}`)
console.log(`Failed sources: ${failed}`)
console.log(`Written: ${output}`)
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

async function fetchSourceText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'PerthPintPricesBot/1.0 (+https://perthpintprices.com)',
      accept: 'text/html, application/pdf, image/*, text/plain;q=0.9, */*;q=0.5',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (isPdfSource(url, contentType)) {
    const pdf = await pdfToText(Buffer.from(await response.arrayBuffer()))
    return {
      text: pdf.text,
      kind: 'pdf',
      contentType,
      modes: pdf.modes,
    }
  }

  if (isImageSource(url, contentType)) {
    if (!ocrEnabled) {
      return { text: '', kind: 'image', contentType, modes: ['image-ocr-disabled'] }
    }

    if (!isSupportedOcrImageSource(url, contentType)) {
      return { text: '', kind: 'image', contentType, modes: ['image-ocr-unsupported'] }
    }

    try {
      return {
        text: await imageToText(Buffer.from(await response.arrayBuffer())),
        kind: 'image',
        contentType,
        modes: ['image-ocr'],
      }
    } catch {
      return { text: '', kind: 'image', contentType, modes: ['image-ocr-error'] }
    }
  }

  const html = await response.text()
  return {
    text: html,
    html,
    kind: 'html',
    contentType,
    modes: ['raw-html'],
  }
}

function isPdfSource(url, contentType) {
  return /\.pdf(?:[?#].*)?$/i.test(url) || /application\/pdf/i.test(contentType || '')
}

function isImageSource(url, contentType) {
  return /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/i.test(url) || /^image\//i.test(contentType || '')
}

function isSupportedOcrImageSource(url, contentType) {
  return /\.(png|jpe?g|webp)(?:[?#].*)?$/i.test(url) || /^image\/(?:png|jpe?g|webp)\b/i.test(contentType || '')
}

async function extractFromSource(url, maxCandidates) {
  const sourceText = await fetchSourceText(url)
  const extractionModes = [...sourceText.modes]
  let candidates = extractOfficialMenuCandidates(sourceText.text, maxCandidates)
  let renderedHtml = ''
  let renderError = null

  if (renderEnabled && sourceText.kind === 'html' && (renderAll || candidates.length === 0)) {
    const renderResult = await renderPageText(url)
    if (renderResult.error) {
      renderError = renderResult.error
    }

    if (renderResult.text || renderResult.html) {
      renderedHtml = renderResult.html
      extractionModes.push('rendered-html')
      candidates = mergeCandidates(
        candidates,
        extractOfficialMenuCandidates(`${renderResult.html}\n${renderResult.text}`, maxCandidates),
        maxCandidates,
      )
    }
  }

  return {
    sourceText,
    extractionModes,
    candidates,
    renderedHtml,
    renderError,
  }
}

function discoverLinkedSources(extraction, baseUrl, limit) {
  const html = [extraction.sourceText.html, extraction.renderedHtml].filter(Boolean).join('\n')
  if (!html) return []

  const sourceKey = canonicalSourceKey(baseUrl)
  return discoverOfficialMenuSources(html, baseUrl, limit)
    .filter((source) => canonicalSourceKey(source.url) !== sourceKey)
}

async function pdfToText(buffer) {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  const modes = ['pdf-text']

  try {
    const textResult = await parser.getText({
      cellSeparator: ' ',
      pageJoiner: '\n',
    })
    const parts = [textResult.text]

    const tableText = await pdfTablesToText(parser)
    if (tableText) {
      modes.push('pdf-table')
      parts.push(tableText)
    }

    if (pdfOcrEnabled && extractOfficialMenuCandidates(parts.join('\n'), 1).length === 0) {
      const ocrText = await pdfScreenshotOcr(parser)
      if (ocrText) {
        modes.push('pdf-ocr')
        parts.push(ocrText)
      }
    }

    return { text: parts.filter(Boolean).join('\n'), modes }
  } finally {
    await parser.destroy()
  }
}
async function pdfTablesToText(parser) {
  try {
    const tableResult = await parser.getTable()
    return tableResult.pages
      .flatMap((page) => page.tables)
      .flatMap((table) => table)
      .map((row) => row.map((cell) => cell.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' '))
      .filter(Boolean)
      .join('\n')
  } catch {
    return ''
  }
}

async function pdfScreenshotOcr(parser) {
  try {
    const screenshotResult = await parser.getScreenshot({
      first: 2,
      desiredWidth: 1600,
      imageDataUrl: false,
      imageBuffer: true,
    })

    const pages = []
    for (const page of screenshotResult.pages) {
      pages.push(await imageToText(Buffer.from(page.data)))
    }

    return pages.join('\n')
  } catch {
    return ''
  }
}

async function imageToText(buffer) {
  const { createWorker } = await import('tesseract.js')
  mkdirSync('.cache/tesseract', { recursive: true })
  ocrWorker ||= await createWorker('eng', 1, { cachePath: '.cache/tesseract' })
  const result = await ocrWorker.recognize(buffer)
  return result.data.text
}

async function closeOcrWorker() {
  if (!ocrWorker) return
  await ocrWorker.terminate()
  ocrWorker = null
}

async function renderPageText(url) {
  let page = null

  try {
    const { chromium } = await import('playwright')
    renderBrowser ||= await chromium.launch({ headless: true })
    page = await renderBrowser.newPage({
      userAgent: 'PerthPintPricesBot/1.0 (+https://perthpintprices.com)',
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    const text = await page.locator('body').innerText({ timeout: 5000 })
    const html = await page.content()
    return { text, html, error: null }
  } catch (err) {
    return { text: '', html: '', error: err instanceof Error ? err.message : String(err) }
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
  const byKey = new Map()

  for (const candidate of [...existing, ...next]) {
    const key = `${candidate.beerType || 'pint'}:${candidate.price}:${candidate.evidenceText.toLowerCase()}`
    if (!byKey.has(key)) byKey.set(key, candidate)
  }

  return Array.from(byKey.values()).slice(0, limit)
}

function withCandidateSource(candidates, sourceUrl, sourceKind, extractionModes) {
  return candidates.map((candidate) => ({
    ...candidate,
    source_url: sourceUrl,
    source_kind: sourceKind,
    extraction_modes: extractionModes,
  }))
}

function canonicalSourceKey(url) {
  const parsed = new URL(url)
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  }
  return parsed.toString()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
