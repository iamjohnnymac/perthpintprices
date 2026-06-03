#!/usr/bin/env node
/**
 * Build a crawler seed file from a reviewed discovery artifact.
 *
 * This is a local review helper only: it reads JSON and writes JSON. It does
 * not fetch sources, insert price_reports, or update pubs.
 *
 * Usage:
 *   npm run build:official-menu-seeds -- --input scripts/official-menu-source-candidates.json --output scripts/official-menu-seeds.large.json
 */
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const input = arg('--input') || 'scripts/official-menu-source-candidates.json'
const output = arg('--output') || 'scripts/official-menu-seeds.generated.json'
const minScore = Number.parseInt(arg('--min-score') || '5', 10)
const perPub = Number.parseInt(arg('--per-pub') || '2', 10)
const includeImages = !args.includes('--no-images')
const IMAGE_SOURCE_RE = /\b(tap[-\s]?list|wine-list|bar-menu|drink[-\s]?menu|drinks[-\s]?menu|menu|menus)\b/i
const IMAGE_ASSET_RE = /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/i
const UNSUPPORTED_IMAGE_RE = /\.avif(?:[?#].*)?$/i
const LOW_INTENT_URL_RE =
  /(?:^|[\W_])(shop|products?|product-category|cart|checkout|giftcards?|gift[-\s]?cards?|breakfast|kids?)(?:$|[\W_])/i

const artifact = JSON.parse(readFileSync(input, 'utf8'))
if (!Array.isArray(artifact.results)) {
  throw new Error(`${input} must contain a discovery "results" array`)
}

const sources = []

for (const result of artifact.results) {
  const candidates = (result.candidates || [])
    .filter((candidate) => isSeedCandidate(candidate))
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, perPub)

  for (const candidate of candidates) {
    sources.push({
      pub_slug: result.pub_slug,
      url: candidate.url,
      label: `discovered ${candidate.type} source: ${(candidate.reasons || []).join(', ')}`,
    })
  }
}

writeFileSync(output, JSON.stringify({ sources }, null, 2))

console.log(`Input: ${input}`)
console.log(`Output: ${output}`)
console.log(`Sources: ${sources.length}`)
console.log(`Filters: min score ${minScore}, max ${perPub} per pub, images ${includeImages ? 'included' : 'excluded'}`)

function isSeedCandidate(candidate) {
  if (!candidate || !candidate.url) return false
  if ((candidate.score || 0) < minScore) return false
  if ((candidate.reasons || []).includes('low-intent')) return false
  if (LOW_INTENT_URL_RE.test(candidate.url)) return false
  if (UNSUPPORTED_IMAGE_RE.test(candidate.url)) return false
  if (IMAGE_ASSET_RE.test(candidate.url) && !IMAGE_SOURCE_RE.test(candidate.url)) return false
  if (candidate.type === 'image' && (!includeImages || !IMAGE_SOURCE_RE.test(candidate.url))) return false
  return candidate.type === 'html' || candidate.type === 'pdf' || candidate.type === 'image'
}

function arg(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : null
}
