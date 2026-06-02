export interface OfficialMenuCandidate {
  beerType: string | null
  price: number
  evidenceText: string
}

const PRICE_VALUE_RE = /(?:\$|aud\s*)\s*(\d{1,2}(?:\.\d{1,2})?)/gi
const DRINK_RE = /\b(pint|pints|draught|draft|tap|lager|ale|beer|cider)\b/i
const BARE_PRICE_DRINK_RE = /\b(pints?|draught|draft|tap\s*beers?|lager|ale|cider)\b/i
const BARE_PRICE_RE = /(?:^|\s)(\d{1,2}(?:\.\d{1,2})?)\s*$/
const BARE_NUMBER_RE = /\b\d{1,2}(?:\.\d{1,2})?\b/g
const SKIP_RE =
  /\b(happy\s*hour|specials?|deal|promo|members?|jug|bottle|btl|can|cocktails?|mocktails?|wine|chardonnay|spirit|vodka|gin|rum|tequila|whisk(?:e)?y|bourbon|makers?\s+mark|mule|margarita|martini|spritz(?:es)?|negroni|liqueur|food|lunch\s*specials?|roast|juice|ginger\s*(?:ale|beer)|soft\s*drink|lemonade|soda|tonic|non[-\s]?alcoholic|alcohol[-\s]?free|zero[-\s]?alcohol|heaps\s+normal|lightning\s+minds|hiatus|battered|burger|fish|chips)\b/i

export function extractOfficialMenuCandidates(input: string, limit = 10): OfficialMenuCandidate[] {
  const seen = new Set<string>()
  const candidates: OfficialMenuCandidate[] = []

  for (const line of menuLines(input)) {
    if (!DRINK_RE.test(line) || SKIP_RE.test(line)) continue

    const priceMatch = findPrice(line)
    if (!priceMatch) continue

    const price = Number.parseFloat(priceMatch.value)
    if (!Number.isFinite(price) || price < 3 || price > 30) continue

    const beerType = inferBeerType(line, priceMatch.text)
    const key = `${beerType || 'pint'}:${price}:${line.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)

    candidates.push({
      beerType,
      price,
      evidenceText: line,
    })

    if (candidates.length >= limit) break
  }

  return candidates
}

function structuredMenuLines(input: string): string[] {
  const lines: string[] = []
  const scriptRe = /<script\b[^>]*type=["'][^"']*application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi

  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(input)) !== null) {
    try {
      collectStructuredMenuLines(JSON.parse(decodeEntities(match[1] || '')), lines)
    } catch {
      // Ignore malformed JSON-LD; venue sites often include unrelated scripts.
    }
  }

  return lines
}

function collectStructuredMenuLines(value: unknown, lines: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectStructuredMenuLines(item, lines)
    return
  }

  if (!value || typeof value !== 'object') return

  const node = value as Record<string, unknown>
  if (isMenuItemType(node['@type'])) {
    const name = stringValue(node.name)
    const price = offerPrice(node.offers) || offerPrice(node.offer) || stringValue(node.price)
    if (name && price) {
      lines.push(`${name} ${formatPriceText(price)}`)
    }
  }

  for (const child of Object.values(node)) {
    collectStructuredMenuLines(child, lines)
  }
}

function isMenuItemType(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(isMenuItemType)
  return typeof value === 'string' && /\bMenuItem\b/i.test(value)
}

function offerPrice(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const price = offerPrice(item)
      if (price) return price
    }
    return null
  }

  if (!value || typeof value !== 'object') return null

  const offer = value as Record<string, unknown>
  return stringValue(offer.price) || offerPrice(offer.priceSpecification)
}

function stringValue(value: unknown): string | null {
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function formatPriceText(value: string): string {
  return /(?:\$|aud\s*)/i.test(value) ? value : `$${value}`
}

function findPrice(line: string): { text: string; value: string } | null {
  const explicitPrices = Array.from(line.matchAll(PRICE_VALUE_RE))
  if (explicitPrices.length > 1) return null
  if (explicitPrices.length === 1) {
    const explicitPrice = explicitPrices[0]
    return { text: explicitPrice[0], value: explicitPrice[1] }
  }

  if (!BARE_PRICE_DRINK_RE.test(line)) return null
  if ((line.match(BARE_NUMBER_RE) || []).length > 1) return null

  const barePrice = line.match(BARE_PRICE_RE)
  if (!barePrice) return null

  return { text: barePrice[1], value: barePrice[1] }
}

export function menuLines(input: string): string[] {
  const lines = htmlToText(input)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  return dedupeLines([
    ...structuredMenuLines(input),
    ...expandAdjacentPriceLines(lines),
  ]).filter((line) => line.length >= 8 && line.length <= 180)
}

function expandAdjacentPriceLines(lines: string[]): string[] {
  const expanded: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    expanded.push(line)

    const next = lines[i + 1]
    if (next && DRINK_RE.test(line) && standalonePriceLine(next)) {
      expanded.push(`${line} ${next}`)
    }
  }

  return expanded
}

function standalonePriceLine(line: string): boolean {
  return /^(?:\$|aud\s*)?\s*\d{1,2}(?:\.\d{1,2})?\s*$/i.test(line)
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const line of lines) {
    const key = line.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(line)
  }

  return unique
}

function htmlToText(input: string): string {
  return decodeEntities(input)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
    .replace(/<(br|p|li|tr|td|th|div|section|article|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n\s+/g, '\n')
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&dollar;/gi, '$')
    .replace(/&#36;/g, '$')
    .replace(/&ndash;|&mdash;/gi, '-')
}

function inferBeerType(line: string, priceText: string): string | null {
  const beforePrice = line.split(priceText)[0] || line
  const cleaned = beforePrice
    .replace(/\b(pints?|draught|draft|tap|beers?|cider|from|only|glass|middy|schooner)\b/gi, ' ')
    .replace(/[|:,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || cleaned.length < 3) return null
  return cleaned.slice(0, 80)
}
