export type OfficialMenuSourceType = 'html' | 'pdf' | 'image' | 'other'

export interface OfficialMenuSourceCandidate {
  url: string
  label: string
  type: OfficialMenuSourceType
  score: number
  reasons: string[]
}

interface RawLink {
  url: string
  label: string
}

const HIGH_INTENT_RE = /\b(drinks?|beverages?|beer|tap[-\s]?list|wine-list|bar-menu)\b/i
const MENU_RE = /\b(menu|menus|eat[-\s]?drink|food[-\s]?drink)\b/i
const LOW_INTENT_RE = /\b(contact|booking|bookings|function|events?|privacy|terms|feed|wp-json|xmlrpc|login|cart|checkout)\b/i
const ASSET_RE = /\.(pdf|png|jpe?g|webp)(?:[?#].*)?$/i

export function discoverOfficialMenuSources(html: string, baseUrl: string, limit = 5): OfficialMenuSourceCandidate[] {
  const byUrl = new Map<string, OfficialMenuSourceCandidate>()

  for (const link of extractLinks(html, baseUrl)) {
    const candidate = scoreLink(link)
    if (candidate.score <= 0) continue

    const existing = byUrl.get(candidate.url)
    if (!existing || candidate.score > existing.score) {
      byUrl.set(candidate.url, candidate)
    }
  }

  return Array.from(byUrl.values())
    .sort((a, b) => b.score - a.score || a.url.localeCompare(b.url))
    .slice(0, limit)
}

export function extractLinks(html: string, baseUrl: string): RawLink[] {
  const links: RawLink[] = []
  const base = new URL(baseUrl)
  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi

  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1]?.trim()
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue

    try {
      const url = new URL(href, base)
      url.hash = ''
      if (!url.protocol.startsWith('http')) continue

      links.push({
        url: url.toString(),
        label: cleanLabel(match[2] || ''),
      })
    } catch {
      // Ignore malformed links from third-party pages.
    }
  }

  return links
}

function scoreLink(link: RawLink): OfficialMenuSourceCandidate {
  const haystack = `${link.url} ${link.label}`
  const reasons: string[] = []
  let score = 0

  if (HIGH_INTENT_RE.test(haystack)) {
    score += 8
    reasons.push('drinks-or-beer')
  }

  if (MENU_RE.test(haystack)) {
    score += 5
    reasons.push('menu')
  }

  if (/\.pdf(?:[?#].*)?$/i.test(link.url)) {
    score += 4
    reasons.push('pdf')
  }

  if (ASSET_RE.test(link.url) && !/\.pdf/i.test(link.url)) {
    score += 1
    reasons.push('image-asset')
  }

  if (LOW_INTENT_RE.test(haystack)) {
    score -= 6
    reasons.push('low-intent')
  }

  return {
    url: link.url,
    label: link.label,
    type: sourceType(link.url),
    score,
    reasons,
  }
}

function sourceType(url: string): OfficialMenuSourceType {
  if (/\.pdf(?:[?#].*)?$/i.test(url)) return 'pdf'
  if (/\.(png|jpe?g|webp)(?:[?#].*)?$/i.test(url)) return 'image'
  if (/^https?:\/\//i.test(url)) return 'html'
  return 'other'
}

function cleanLabel(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}
