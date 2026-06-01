export type PriceConfidence = 'high' | 'medium' | 'low'
export type PriceSource = 'andrew' | 'crowdsourced' | 'menu_scan'

export function normalizePriceConfidence(value: unknown): PriceConfidence | null {
  if (typeof value !== 'string') return null
  const confidence = value.trim().toLowerCase()
  return confidence === 'high' || confidence === 'medium' || confidence === 'low'
    ? confidence
    : null
}

export function priceReportSource(notes: unknown): PriceSource {
  return typeof notes === 'string' && notes.toLowerCase().includes('menu scan')
    ? 'menu_scan'
    : 'crowdsourced'
}

export function priceReportConfidence(notes: unknown): PriceConfidence {
  return priceReportSource(notes) === 'menu_scan' ? 'low' : 'medium'
}

export function describePriceSource(source: string | null | undefined): string | null {
  if (!source) return null
  const normalized = source.trim().toLowerCase()

  if (normalized === 'andrew' || normalized === 'phone_agent' || normalized.startsWith('elevenlabs')) {
    return 'by Andrew'
  }
  if (normalized === 'menu_scan') {
    return 'from a menu scan'
  }
  if (normalized === 'crowdsourced') {
    return 'by a local'
  }

  return `by ${source}`
}
