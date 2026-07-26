import { unwrapVoiceField } from './voicePrice'

interface SanitizeVendorTextOptions {
  destination?: string
  maxLength?: number
  redactStandaloneName?: boolean
}

function vendorString(value: unknown): string | null {
  const unwrapped = unwrapVoiceField(value)
  if (unwrapped == null) return null
  const text = String(unwrapped).trim()
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'none') return null
  return text
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function sanitizeVendorText(value: unknown, options: SanitizeVendorTextOptions = {}): string | null {
  const source = vendorString(value)
  if (!source) return null

  let sanitized = source
  const destination = options.destination
  if (destination) {
    const digits = destination.replace(/\D/g, '')
    sanitized = sanitized.replace(new RegExp(escapeRegExp(destination), 'g'), '[phone redacted]')
    if (digits) sanitized = sanitized.replace(new RegExp(escapeRegExp(digits), 'g'), '[phone redacted]')
  }

  sanitized = sanitized
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email redacted]')
    .replace(/(?:\+?\d[\s().-]*){7,}\d/g, '[phone redacted]')
    .replace(/\b(?:my name is|name is|ask for|contact|owner(?: is)?|manager(?: is)?|bartender(?: is)?|speaking with)\s+\p{L}[\p{L}'-]*(?:\s+\p{L}[\p{L}'-]*){0,3}(?=\s+(?:at|on|via)\b|[.,;:]|$)/giu, '[name redacted]')
    .replace(/\b(?:name|owner|manager|contact)\s*:\s*\p{L}[\p{L}'-]*(?:\s+\p{L}[\p{L}'-]*){0,3}(?=\s+(?:at|on|via)\b|[.,;:]|$)/giu, '[name redacted]')

  if (
    options.redactStandaloneName
    && /^\p{L}[\p{L}'-]*(?:\s+\p{L}[\p{L}'-]*){0,2}[.!]?$/iu.test(sanitized)
  ) {
    sanitized = '[name redacted]'
  }

  return sanitized.slice(0, options.maxLength ?? 700)
}
