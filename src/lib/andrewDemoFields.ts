import { normalizeVoicePintPrice, unwrapVoiceField, type VoiceServingUnit } from './voicePrice'

const KNOWN_BEERS = new Map([
  'swan',
  'swan draught',
  'coopers',
  'coopers pale',
  'great northern',
  'xxxx gold',
  'little creatures',
  'carlton draught',
  'hahn',
  'hahn super dry',
  'pirate life',
  'gage roads',
  'feral',
].map(beer => [beer, beer.replace(/\b\w/g, letter => letter.toUpperCase())]))

KNOWN_BEERS.set('xxxx gold', 'XXXX Gold')

const DAY_TOKEN = '(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|weekdays?|weekends?|daily|every day)'
const HAPPY_HOUR_PATTERN = new RegExp(
  `^${DAY_TOKEN}(?:\\s*(?:-|to)\\s*${DAY_TOKEN})?\\s*[,·:]?\\s*(\\d{1,2})(?::([0-5]\\d))?\\s*(am|pm)?\\s*(?:-|to)\\s*(\\d{1,2})(?::([0-5]\\d))?\\s*(am|pm)\\s*$`,
  'i',
)

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', monday: 'Mon',
  tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
  wed: 'Wed', wednesday: 'Wed',
  thu: 'Thu', thurs: 'Thu', thursday: 'Thu',
  fri: 'Fri', friday: 'Fri',
  sat: 'Sat', saturday: 'Sat',
  sun: 'Sun', sunday: 'Sun',
  weekday: 'Mon–Fri', weekdays: 'Mon–Fri',
  weekend: 'Sat–Sun', weekends: 'Sat–Sun',
  daily: 'Daily', 'every day': 'Daily',
}

function strictString(value: unknown): string | null {
  const unwrapped = unwrapVoiceField(value)
  if (typeof unwrapped !== 'string') return null
  const text = unwrapped.trim().replace(/\s+/g, ' ')
  return text || null
}

export function parseAndrewDemoUnit(value: unknown): VoiceServingUnit | null {
  const unwrapped = unwrapVoiceField(value)
  if (unwrapped == null || unwrapped === '') return 'pint'
  if (typeof unwrapped !== 'string') return null
  const unit = unwrapped.trim().toLowerCase()
  return unit === 'pint' || unit === 'schooner' || unit === 'pot' ? unit : null
}

export function parseAndrewDemoPrice(price: unknown, unit: unknown): number | null {
  const unwrapped = unwrapVoiceField(price)
  const safePrice = typeof unwrapped === 'number'
    ? unwrapped
    : typeof unwrapped === 'string' && /^\s*\$?\d{1,2}(?:\.\d{1,2})?\s*(?:aud|dollars?)?\s*$/i.test(unwrapped)
      ? Number.parseFloat(unwrapped.replace(/[^\d.]/g, ''))
      : null
  const safeUnit = parseAndrewDemoUnit(unit)
  if (safePrice == null || !Number.isFinite(safePrice) || !safeUnit) return null
  return normalizeVoicePintPrice(safePrice, safeUnit)
}

export function parseAndrewDemoBeer(value: unknown): string | null {
  const beer = strictString(value)
  if (!beer) return null
  return KNOWN_BEERS.get(beer.toLowerCase()) || null
}

export function parseAndrewDemoConfidence(value: unknown): 'high' | 'medium' | 'low' | null {
  const confidence = strictString(value)?.toLowerCase()
  return confidence === 'high' || confidence === 'medium' || confidence === 'low' ? confidence : null
}

function dayLabel(value: string) {
  return DAY_LABELS[value.toLowerCase()] || null
}

function timeLabel(hour: number, minute: string | undefined, meridiem: string | undefined) {
  const minutes = minute && minute !== '00' ? `:${minute}` : ''
  return `${hour}${minutes}${meridiem?.toLowerCase() || ''}`
}

export function parseAndrewDemoHappyHour(value: unknown): string | null {
  const source = strictString(value)?.replace(/[–—]/g, '-')
  if (!source || source.length > 80) return null
  const match = source.match(HAPPY_HOUR_PATTERN)
  if (!match) return null

  const [, firstDay, lastDay, startHourText, startMinute, startMeridiem, endHourText, endMinute, endMeridiem] = match
  const firstDayLabel = dayLabel(firstDay)
  const lastDayLabel = lastDay ? dayLabel(lastDay) : null
  if (!firstDayLabel || (lastDay && !lastDayLabel)) return null
  if (lastDay && (firstDayLabel.includes('–') || firstDayLabel === 'Daily' || lastDayLabel?.includes('–') || lastDayLabel === 'Daily')) {
    return null
  }

  const startHour = Number(startHourText)
  const endHour = Number(endHourText)
  if (startHour < 1 || startHour > 12 || endHour < 1 || endHour > 12) return null

  const day = lastDayLabel ? `${firstDayLabel}–${lastDayLabel}` : firstDayLabel
  const start = timeLabel(startHour, startMinute, startMeridiem)
  const end = timeLabel(endHour, endMinute, endMeridiem)
  return `${day} · ${start}–${end}`
}
