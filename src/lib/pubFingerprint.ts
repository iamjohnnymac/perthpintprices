import { createHash } from 'node:crypto'

/**
 * Pub-page "shell" fingerprint (issue #80).
 *
 * Reduces a rendered pub page's HTML to its content skeleton — module presence
 * and order, with venue-specific values (the pub name, prices, any digits)
 * stripped — then hashes it. Two pages built from the same module composition
 * hash identically; a healthy template produces many distinct shells, while a
 * scaled-content collapse (every page the same thin shell) produces one or two.
 *
 * The skeleton is the ordered sequence of heading landmarks (h1–h3) plus a
 * coarse section count. Headings are where module identity lives on a pub page
 * ("Cheaper nearby", "{name} pint FAQ", the data-gated FAQ questions), so the
 * set of headings — once the name and numbers are tokenised out — captures which
 * modules rendered without depending on the prose itself.
 */

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripNoise(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
}

/** Tokenise a heading: drop the venue name and all digits so only the template remains. */
function tokeniseHeading(text: string, name: string): string {
  let t = decodeEntities(text.replace(/<[^>]+>/g, ' '))
  t = t.replace(/\s+/g, ' ').trim().toLowerCase()
  const trimmedName = name.trim().toLowerCase()
  if (trimmedName) {
    // Whole name first, then individual words, so "the windsor hotel" and a bare
    // "windsor" both collapse to the same token.
    t = t.split(trimmedName).join('NAME')
    for (const word of trimmedName.split(/\s+/)) {
      if (word.length >= 3) t = t.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'g'), 'NAME')
    }
  }
  t = t.replace(/\d+/g, '#')
  return t.replace(/\s+/g, ' ').trim()
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The ordered, value-stripped content skeleton of a pub page. */
export function pubContentSkeleton(html: string, name: string): string {
  const body = stripNoise(html)
  const sectionCount = (body.match(/<section\b/gi) || []).length
  const headings: string[] = []
  const re = /<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    headings.push(`${m[1].toLowerCase()}:${tokeniseHeading(m[2], name)}`)
  }
  return `sec=${sectionCount}|${headings.join('|')}`
}

/** sha1 of the content skeleton — the shell fingerprint. */
export function pubFingerprint(html: string, name: string): string {
  return createHash('sha1').update(pubContentSkeleton(html, name)).digest('hex')
}

export interface FingerprintReport {
  total: number
  distinct: number
  /** Fingerprints shared by more than one page, largest cluster first. */
  clusters: Array<{ fingerprint: string; count: number }>
  largestClusterShare: number
}

/** Aggregate a set of fingerprints into a distinct-shell report. */
export function summariseFingerprints(fingerprints: string[]): FingerprintReport {
  const counts = new Map<string, number>()
  for (const fp of fingerprints) counts.set(fp, (counts.get(fp) ?? 0) + 1)
  const clusters = Array.from(counts.entries())
    .map(([fingerprint, count]) => ({ fingerprint, count }))
    .sort((a, b) => b.count - a.count)
  const total = fingerprints.length
  const largest = clusters[0]?.count ?? 0
  return {
    total,
    distinct: counts.size,
    clusters: clusters.filter((c) => c.count > 1),
    largestClusterShare: total > 0 ? largest / total : 0,
  }
}
