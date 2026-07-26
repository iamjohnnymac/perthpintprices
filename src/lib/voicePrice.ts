export type VoiceServingUnit = 'pint' | 'schooner' | 'pot'

const UNIT_TO_PINT: Record<VoiceServingUnit, number> = {
  pint: 1,
  schooner: 570 / 425,
  pot: 570 / 285,
}

export function unwrapVoiceField(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
    return unwrapVoiceField((value as { value: unknown }).value)
  }
  return value
}

export function parseVoiceNumber(value: unknown): number | null {
  const unwrapped = unwrapVoiceField(value)
  if (unwrapped == null) return null
  const parsed = typeof unwrapped === 'number' ? unwrapped : Number.parseFloat(String(unwrapped))
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeVoiceUnit(value: unknown): VoiceServingUnit {
  const unwrapped = unwrapVoiceField(value)
  const candidate = typeof unwrapped === 'string' ? unwrapped.trim().toLowerCase() : ''
  return candidate === 'schooner' || candidate === 'pot' ? candidate : 'pint'
}

export function normalizeVoicePintPrice(price: unknown, unit: unknown): number | null {
  const parsedPrice = parseVoiceNumber(price)
  if (parsedPrice == null) return null
  const normalized = Number((parsedPrice * UNIT_TO_PINT[normalizeVoiceUnit(unit)]).toFixed(2))
  return normalized >= 5 && normalized <= 20 ? normalized : null
}
