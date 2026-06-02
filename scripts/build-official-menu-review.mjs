#!/usr/bin/env node
/**
 * Build a local review queue from an official menu crawl artifact.
 *
 * This helper only reads and writes local files. It does not fetch sources,
 * insert price_reports, or update pubs.
 *
 * Usage:
 *   npm run build:official-menu-review
 *   npm run build:official-menu-review -- --input scripts/official-menu-crawl-results-large.json
 */
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const input = arg('--input') || 'scripts/official-menu-crawl-results-large.json'
const csvOutput = arg('--csv-output') || 'scripts/official-menu-review.csv'
const jsonOutput = arg('--json-output') || 'scripts/official-menu-review.json'
const suggestDecisions = args.includes('--suggest-decisions')

const artifact = JSON.parse(readFileSync(input, 'utf8'))
if (!Array.isArray(artifact.results)) {
  throw new Error(`${input} must contain a crawl "results" array`)
}

const rows = []

for (const result of artifact.results) {
  for (const candidate of result.candidates || []) {
    const beerType = cleanBeerType(candidate.beerType, candidate.price)
    const confidence = confidenceFor(candidate.evidenceText)
    const suggestion = suggestDecisions
      ? decisionSuggestion(candidate.evidenceText, confidence, beerType)
      : { decision: '', notes: '' }

    rows.push({
      pub_slug: result.pub_slug,
      pub_name: result.pub_name || '',
      price: candidate.price,
      beer_type: beerType,
      evidence_text: candidate.evidenceText,
      source_url: candidate.source_url || result.url,
      source_kind: candidate.source_kind || result.source_kind || '',
      extraction_modes: candidate.extraction_modes
        ? candidate.extraction_modes.join('|')
        : (result.extraction_modes || []).join('|'),
      confidence,
      decision: suggestion.decision,
      notes: suggestion.notes,
    })
  }
}

writeFileSync(jsonOutput, JSON.stringify({ generated_at: new Date().toISOString(), input, rows }, null, 2))
writeFileSync(csvOutput, toCsv(rows))

console.log(`Input: ${input}`)
console.log(`CSV output: ${csvOutput}`)
console.log(`JSON output: ${jsonOutput}`)
console.log(`Review rows: ${rows.length}`)
console.log(`Suggested decisions: ${suggestDecisions ? 'enabled' : 'disabled'}`)

function confidenceFor(evidenceText) {
  if (/\bpints?\b/i.test(evidenceText)) return 'strong'
  if (/\b(draught|draft|tap\s*beer)\b/i.test(evidenceText)) return 'strong'
  return 'review'
}

function cleanBeerType(beerType, price) {
  const text = typeof beerType === 'string' ? beerType.trim() : ''
  if (!text) return ''
  if (text === String(price) || text === `$${price}`) return ''
  if (/^\$?\d{1,2}(?:\.\d{1,2})?$/.test(text)) return ''
  return text
}

function decisionSuggestion(evidenceText, confidence, beerType) {
  if (/[\\()]{2,}/.test(evidenceText)) {
    return {
      decision: 'needs_manual_review',
      notes: 'OCR/text extraction is messy; verify source menu before using.',
    }
  }

  if (confidence === 'strong') {
    return {
      decision: 'approve_suggested',
      notes: beerType ? 'Explicit pint/draught/tap evidence.' : 'Explicit pint/draught/tap evidence; beer type unknown.',
    }
  }

  return {
    decision: 'needs_manual_review',
    notes: 'Beer/cider price found on official menu source, but size is not explicit in the evidence line.',
  }
}

function toCsv(rows) {
  const headers = [
    'pub_slug',
    'pub_name',
    'price',
    'beer_type',
    'evidence_text',
    'source_url',
    'source_kind',
    'extraction_modes',
    'confidence',
    'decision',
    'notes',
  ]

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(',')),
  ].join('\n') + '\n'
}

function csvValue(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function arg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : null
}
