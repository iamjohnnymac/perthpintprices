#!/usr/bin/env node
/**
 * Import approved official-menu review rows as pending price_reports.
 *
 * Default mode is dry-run: it writes a local import plan and does not touch
 * Supabase. Use --write only after reviewing the plan.
 *
 * Usage:
 *   npm run import:official-menu-review
 *   npm run import:official-menu-review -- --file scripts/official-menu-review.suggested.json --write
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const IMPORTER_VERSION = 'official-menu-review-import-v1'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
const args = process.argv.slice(2)
const shouldWrite = args.includes('--write')
const allowAnonWrite = args.includes('--allow-anon-write')
const reviewFile = arg('--file') || 'scripts/official-menu-review.suggested.json'
const output = arg('--output') || 'scripts/official-menu-import-plan.json'
const decision = arg('--decision') || 'approve_suggested'

const review = JSON.parse(readFileSync(reviewFile, 'utf8'))
if (!Array.isArray(review.rows)) {
  throw new Error(`${reviewFile} must contain a review "rows" array`)
}

const approvedRows = review.rows
  .filter((row) => decision === 'all' || row.decision === decision)
  .filter(isImportableReviewRow)

const observedAt = new Date().toISOString()
const plannedRows = approvedRows.map((row) => toPriceReportRow(row, observedAt))
let existingRows = []
let insertRows = plannedRows
let inserted = 0
let writeKeyMode = 'none'

if (shouldWrite) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const writeKey = serviceKey || (allowAnonWrite ? SUPABASE_ANON_KEY : null)
  writeKeyMode = serviceKey ? 'service_role' : 'anon'
  if (!writeKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required when using --write, unless --allow-anon-write is provided')
  }

  const supabase = createClient(SUPABASE_URL, writeKey, { auth: { persistSession: false } })
  const { data: existing, error: existingErr } = await supabase
    .from('price_reports')
    .select('id, pub_slug, reported_price, source_url, evidence_text')
    .eq('submission_source', 'official_menu')

  if (existingErr) {
    throw new Error(`existing report lookup failed: ${existingErr.message}`)
  }

  existingRows = existing || []
  const existingKeys = new Set(existingRows.map(reportKey))
  insertRows = plannedRows.filter((row) => !existingKeys.has(reportKey(row)))

  if (insertRows.length > 0) {
    const { error: insertErr } = await supabase.from('price_reports').insert(insertRows)
    if (insertErr) {
      throw new Error(`insert failed: ${insertErr.message}`)
    }
    inserted = insertRows.length
  }
}

const artifact = {
  generated_at: observedAt,
  mode: shouldWrite ? 'write' : 'dry_run',
  review_file: reviewFile,
  decision,
  summary: {
    review_rows: review.rows.length,
    matched_rows: approvedRows.length,
    planned_rows: plannedRows.length,
    existing_official_menu_rows: existingRows.length,
    insertable_rows: insertRows.length,
    inserted,
  },
  write_key_mode: writeKeyMode,
  rows: insertRows,
}

writeFileSync(output, JSON.stringify(artifact, null, 2))

console.log(`Review file: ${reviewFile}`)
console.log(`Decision: ${decision}`)
console.log(`Mode: ${shouldWrite ? 'write' : 'dry run (no writes)'}`)
console.log(`Write key mode: ${writeKeyMode}`)
console.log(`Planned rows: ${plannedRows.length}`)
console.log(`Insertable rows: ${insertRows.length}`)
console.log(`Inserted rows: ${inserted}`)
console.log(`Output: ${output}`)

function isImportableReviewRow(row) {
  if (!row || typeof row !== 'object') return false
  if (typeof row.pub_slug !== 'string' || !row.pub_slug.trim()) return false
  if (typeof row.source_url !== 'string' || !row.source_url.trim()) return false
  if (typeof row.evidence_text !== 'string' || !row.evidence_text.trim()) return false

  const price = Number(row.price)
  return Number.isFinite(price) && price >= 3 && price <= 30
}

function toPriceReportRow(row, observedAt) {
  return {
    pub_slug: row.pub_slug,
    reported_price: Number(row.price),
    beer_type: importBeerType(row.beer_type),
    reporter_name: 'Official menu crawler',
    report_type: 'price_report',
    notes: `Official menu review import: ${row.decision}`,
    submission_source: 'official_menu',
    source_url: row.source_url,
    evidence_text: row.evidence_text,
    observed_at: observedAt,
    raw_extraction: {
      review_row: row,
    },
    extractor_version: IMPORTER_VERSION,
  }
}

function importBeerType(value) {
  const beerType = typeof value === 'string' ? value.trim() : ''
  if (!beerType || /[\\()]/.test(beerType)) return 'On tap'
  return beerType
}

function reportKey(row) {
  return [
    row.pub_slug,
    Number(row.reported_price).toFixed(2),
    row.source_url || '',
    row.evidence_text || '',
  ].join('\n')
}

function arg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : null
}
