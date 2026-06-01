export interface OfficialMenuCandidate {
  beerType: string | null
  price: number
  evidenceText: string
}

const PRICE_RE = /(?:\$|aud\s*)\s*(\d{1,2}(?:\.\d{1,2})?)/i
const DRINK_RE = /\b(pint|pints|draught|draft|tap|lager|ale|beer|cider)\b/i
const SKIP_RE = /\b(happy\s*hour|special|deal|promo|members?|jug|bottle|can|cocktail|wine|spirit|food)\b/i

export function extractOfficialMenuCandidates(input: string, limit = 10): OfficialMenuCandidate[] {
  const seen = new Set<string>()
  const candidates: OfficialMenuCandidate[] = []

  for (const line of menuLines(input)) {
    if (!DRINK_RE.test(line) || SKIP_RE.test(line)) continue

    const priceMatch = line.match(PRICE_RE)
    if (!priceMatch) continue

    const price = Number.parseFloat(priceMatch[1])
    if (!Number.isFinite(price) || price < 3 || price > 30) continue

    const beerType = inferBeerType(line, priceMatch[0])
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

export function menuLines(input: string): string[] {
  return htmlToText(input)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 8 && line.length <= 180)
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
    .replace(/&dollar;/gi, '$')
    .replace(/&#36;/g, '$')
    .replace(/&ndash;|&mdash;/gi, '-')
}

function inferBeerType(line: string, priceText: string): string | null {
  const beforePrice = line.split(priceText)[0] || line
  const cleaned = beforePrice
    .replace(/\b(pints?|draught|draft|tap|beer|cider|from|only|glass|middy|schooner)\b/gi, ' ')
    .replace(/[|:,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || cleaned.length < 3) return null
  return cleaned.slice(0, 80)
}
