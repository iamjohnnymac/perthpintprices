/**
 * Duplicate-cluster fingerprint guard (issue #80, metric M6).
 *
 * Scans the prerendered pub-page HTML in .next/server/app, reduces each page to
 * a value-stripped content shell (see src/lib/pubFingerprint.ts), and asserts
 * the pages span many distinct shells rather than collapsing to one or two thin
 * templates. A standing regression guard for the data-gating model: it quantifies
 * scaled-content exposure at build time, before Google sees it.
 *
 * Run after `next build`:  npm run check:fingerprints
 * Exit 0 = healthy; exit 1 = missing/partial output or collapsed shells.
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { join } from 'node:path'
import { pubFingerprint, summariseFingerprints } from '../src/lib/pubFingerprint.ts'

const BUILD_DIR = '.next/server/app'
// Tunable floors. Pub-page shells are inherently data-gated (price known/missing,
// happy hour live/later/none, nearby available, verification tier), so the
// distinct count is bounded by composition variety, not page count. These floors
// catch a collapse to one/two shells without demanding a unique page each.
const MIN_PAGES_TO_ENFORCE = 25
const MIN_DISTINCT_SHELLS = 6
const MAX_LARGEST_CLUSTER_SHARE = 0.9 // no single shell may cover >90% of pages

function firstHeading(html) {
  const m = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)
  if (!m) return ''
  return m[1].replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

function main() {
  let files
  try {
    files = globSync(join(BUILD_DIR, '**/*.html'))
  } catch {
    console.error('[fingerprint-guard] no build output found — run `next build` first.')
    return 1
  }

  const pubFingerprints = []
  for (const file of files) {
    const html = readFileSync(file, 'utf8')
    // Pub pages carry a BarOrPub JSON-LD node; nothing else does.
    if (!html.includes('"@type":"BarOrPub"')) continue
    const name = firstHeading(html)
    pubFingerprints.push(pubFingerprint(html, name))
  }

  const report = summariseFingerprints(pubFingerprints)

  if (report.total < MIN_PAGES_TO_ENFORCE) {
    console.log(
      `[fingerprint-guard] only ${report.total} pub page(s) prerendered (< ${MIN_PAGES_TO_ENFORCE}); ` +
        'build is partial or missing required data.',
    )
    return 1
  }

  console.log(
    `[fingerprint-guard] ${report.total} pub pages → ${report.distinct} distinct shells; ` +
      `largest cluster covers ${(report.largestClusterShare * 100).toFixed(1)}% of pages.`,
  )
  if (report.clusters.length > 0) {
    const top = report.clusters.slice(0, 5).map((c) => `${c.count}×`).join(', ')
    console.log(`[fingerprint-guard] repeated-shell clusters (count): ${top}`)
  }

  const failures = []
  if (report.distinct < MIN_DISTINCT_SHELLS) {
    failures.push(`only ${report.distinct} distinct shells (floor ${MIN_DISTINCT_SHELLS}) — pages are collapsing.`)
  }
  if (report.largestClusterShare > MAX_LARGEST_CLUSTER_SHARE) {
    failures.push(
      `one shell covers ${(report.largestClusterShare * 100).toFixed(1)}% of pages ` +
        `(ceiling ${(MAX_LARGEST_CLUSTER_SHARE * 100).toFixed(0)}%) — scaled-content risk.`,
    )
  }

  if (failures.length > 0) {
    console.error('[fingerprint-guard] FAIL:')
    for (const f of failures) console.error(`  - ${f}`)
    return 1
  }

  console.log('[fingerprint-guard] PASS')
  return 0
}

process.exit(main())
