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
const MENU_PROVIDER_RE =
  /\b(mr\s*yum|mryum|me\s*&\s*u|meandu|hungry\s*hungry|hungryhungry|bopple|oolio|qrd|qr[-\s]?menu)\b/i
const LOW_INTENT_RE =
  /(?:^|[\W_])(contact|booking|bookings|function|events?|privacy|terms|feed|wp-json|xmlrpc|login|cart|checkout|shop|products?|product-category|giftcards?|gift[-\s]?cards?|breakfast|kids?)(?:$|[\W_])/i
const BLOCKED_SOURCE_RE = /(?:^|[\W_])(shop|products?|product-category|cart|checkout|giftcards?|gift[-\s]?cards?|breakfast|kids?)(?:$|[\W_])/i
const ASSET_RE = /\.(pdf|png|jpe?g|webp|avif)(?:[?#].*)?$/i
const IMAGE_SOURCE_RE = /\b(tap[-\s]?list|wine-list|bar-menu|drink[-\s]?menu|drinks[-\s]?menu|menu|menus)\b/i
const STATIC_ASSET_RE = /\.(css|m?js|map|woff2?|ttf|otf)(?:[?#].*)?$/i

export function discoverOfficialMenuSources(html: string, baseUrl: string, limit = 5): OfficialMenuSourceCandidate[] {
  const byUrl = new Map<string, OfficialMenuSourceCandidate>()

  for (const link of extractLinks(html, baseUrl)) {
    const candidate = scoreLink(link)
    if (candidate.score <= 0) continue

    const key = canonicalUrlKey(candidate.url)
    const existing = byUrl.get(key)
    if (!existing || candidate.score > existing.score) {
      byUrl.set(key, candidate)
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
      if (isTemplateUrl(url.toString())) continue

      links.push({
        url: url.toString(),
        label: cleanLabel(match[2] || ''),
      })
    } catch {
      // Ignore malformed links from third-party pages.
    }
  }

  const resourceRe = /<(?:iframe|script|img|source|link)\b[^>]*(?:href|src|data-href|data-src)=["']([^"']+)["'][^>]*>/gi
  while ((match = resourceRe.exec(html)) !== null) {
    const url = resolveHttpUrl(match[1], base)
    if (!url) continue

    links.push({
      url,
      label: cleanLabel(attributeValue(match[0], 'title') || attributeValue(match[0], 'aria-label') || ''),
    })
  }

  links.push(...extractStructuredMenuLinks(html, base))

  return links
}

function scoreLink(link: RawLink): OfficialMenuSourceCandidate {
  const haystack = `${link.url} ${link.label}`
  const reasons: string[] = []
  let score = 0
  const type = sourceType(link.url)

  if (STATIC_ASSET_RE.test(link.url)) {
    return {
      url: link.url,
      label: link.label,
      type,
      score: 0,
      reasons: ['static-asset'],
    }
  }

  if (BLOCKED_SOURCE_RE.test(haystack)) {
    return {
      url: link.url,
      label: link.label,
      type,
      score: 0,
      reasons: ['blocked-source'],
    }
  }

  if (type === 'image' && !IMAGE_SOURCE_RE.test(haystack)) {
    return {
      url: link.url,
      label: link.label,
      type,
      score: 0,
      reasons: ['generic-image'],
    }
  }

  if (HIGH_INTENT_RE.test(haystack)) {
    score += 8
    reasons.push('drinks-or-beer')
  }

  if (MENU_RE.test(haystack)) {
    score += 5
    reasons.push('menu')
  }

  if (MENU_PROVIDER_RE.test(haystack)) {
    score += 10
    reasons.push('menu-provider')
  }

  if (/\.pdf(?:[?#].*)?$/i.test(link.url)) {
    score += 4
    reasons.push('pdf')
  }

  if (ASSET_RE.test(link.url) && !/\.pdf/i.test(link.url) && score > 0) {
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
    type,
    score,
    reasons,
  }
}

function extractStructuredMenuLinks(html: string, base: URL): RawLink[] {
  const links: RawLink[] = []
  const scriptRe = /<script\b[^>]*type=["'][^"']*application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi

  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(html)) !== null) {
    try {
      collectStructuredMenuLinks(JSON.parse(decodeEntities(match[1] || '')), base, links)
    } catch {
      // Ignore malformed JSON-LD; venue pages commonly mix unrelated scripts.
    }
  }

  return links
}

function collectStructuredMenuLinks(value: unknown, base: URL, links: RawLink[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectStructuredMenuLinks(item, base, links)
    return
  }

  if (!value || typeof value !== 'object') return

  const node = value as Record<string, unknown>
  for (const key of ['menu', 'hasMenu', 'url', '@id']) {
    const rawValue = node[key]
    if (typeof rawValue === 'string' && /menu/i.test(`${key} ${rawValue}`)) {
      const url = resolveHttpUrl(rawValue, base)
      if (url) links.push({ url, label: key })
    }
  }

  for (const child of Object.values(node)) {
    collectStructuredMenuLinks(child, base, links)
  }
}

function isTemplateUrl(url: string): boolean {
  return /(?:\[%|%\]|\{\{|\}\})/.test(url)
}

function resolveHttpUrl(value: string | undefined, base: URL): string | null {
  const href = value?.trim()
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null

  try {
    const url = new URL(href, base)
    url.hash = ''
    if (!url.protocol.startsWith('http')) return null
    if (isTemplateUrl(url.toString())) return null
    return url.toString()
  } catch {
    return null
  }
}

function canonicalUrlKey(url: string): string {
  const parsed = new URL(url)
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  }
  return parsed.toString()
}

function sourceType(url: string): OfficialMenuSourceType {
  if (/\.pdf(?:[?#].*)?$/i.test(url)) return 'pdf'
  if (/\.(png|jpe?g|webp|avif)(?:[?#].*)?$/i.test(url)) return 'image'
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

function attributeValue(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))
  return match?.[1] || null
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
}
