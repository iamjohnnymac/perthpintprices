/**
 * Dynamic Happy Hour Price Engine
 * 
 * Checks if a pub's happy hour is currently active based on Perth time (AWST UTC+8).
 * When active, the effective price switches to the happy hour price.
 * 
 * Day formats supported:
 * - "7 days" / "Daily" / "Everyday"
 * - "Mon-Fri" / "Mon-Sat" / "Wed-Fri" / "Thu-Fri" etc.
 * - "Monday" / "Tuesday" / "Wednesday" / "Thursday" / "Friday" / "Saturday" / "Sunday"
 * - "Tue-Thu" / "Mon-Thu" etc.
 */

import { perthNow } from './perthClock'

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

/** Format raw day data into a readable string. */
export function formatHappyHourDays(days: string | null): string {
  if (!days) return ''
  // Handles Postgres array braces, full names ("Tuesday") and short names
  // ("Tue"), collapsing consecutive runs to "Tue–Fri" and tidying comma spacing.
  const raw = days.startsWith('{') && days.endsWith('}') ? days.slice(1, -1) : days
  const shortByIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const tokens = raw.split(',').map(d => d.trim()).filter(Boolean)
  const indices = tokens.map(t => DAY_MAP[t.toLowerCase()])
  if (tokens.length === 0 || indices.some(i => i === undefined)) {
    // Not a clean day list (e.g. "Mon-Fri", "Daily 4-6pm") — just tidy commas.
    return tokens.join(', ')
  }
  const uniq = Array.from(new Set(indices as number[])).sort((a, b) => a - b)
  if (uniq.length === 7) return '7 days'
  if (uniq.length === 5 && [1, 2, 3, 4, 5].every(d => uniq.includes(d))) return 'Mon–Fri'
  if (uniq.length === 2 && uniq.includes(0) && uniq.includes(6)) return 'Weekends'
  if (uniq.length > 2) {
    const consecutive = (arr: number[]) => arr.every((v, i) => i === 0 || v === arr[i - 1] + 1)
    if (consecutive(uniq)) {
      return `${shortByIndex[uniq[0]]}–${shortByIndex[uniq[uniq.length - 1]]}`
    }
    // Wrap-around run (e.g. Wed–Sun = {3,4,5,6,0}): the present days form a single
    // run exactly when the missing days are a contiguous block.
    const present = new Set(uniq)
    const missing = [0, 1, 2, 3, 4, 5, 6].filter(d => !present.has(d))
    if (missing.length > 0 && consecutive(missing)) {
      const start = (missing[missing.length - 1] + 1) % 7
      const end = (missing[0] + 6) % 7
      return `${shortByIndex[start]}–${shortByIndex[end]}`
    }
  }
  return uniq.map(i => shortByIndex[i]).join(', ')
}

function parseDayRange(days: string): number[] {
  const d = days.toLowerCase().trim()
  
  // All week
  if (d === '7 days' || d === 'daily' || d === 'everyday' || d === 'every day') {
    return [0, 1, 2, 3, 4, 5, 6]
  }
  
  // Postgres array format: "{Mon,Tue,Wed,Thu,Fri}" or "{Mon,Tue,Wed,Thu,Fri,Sat,Sun}"
  if (d.startsWith('{') && d.endsWith('}')) {
    const inner = d.slice(1, -1)
    const dayNames = inner.split(',').map(s => s.trim().toLowerCase())
    const result: number[] = []
    for (const name of dayNames) {
      const dayNum = DAY_MAP[name.substring(0, 3)]
      if (dayNum !== undefined) result.push(dayNum)
    }
    return result
  }
  
  // Range like "Mon-Fri", "Tue-Thu", "Wed-Sat"
  const rangeMatch = d.match(/^(\w{3,})-(\w{3,})$/)
  if (rangeMatch) {
    const start = DAY_MAP[rangeMatch[1].substring(0, 3)]
    const end = DAY_MAP[rangeMatch[2].substring(0, 3)]
    if (start !== undefined && end !== undefined) {
      const days: number[] = []
      let current = start
      while (current !== (end + 1) % 7) {
        days.push(current)
        current = (current + 1) % 7
      }
      return days
    }
  }
  
  // Single day like "Tuesday", "Friday"
  const singleDay = DAY_MAP[d.substring(0, 3)]
  if (singleDay !== undefined) {
    return [singleDay]
  }
  
  return []
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  // Handle "17:00:00", "17:00", "5:00 PM" etc.
  const clean = timeStr.replace(/:\d{2}$/, '') // Remove seconds
  const match = clean.match(/^(\d{1,2}):(\d{2})/)
  if (match) {
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) }
  }
  return null
}

export interface HappyHourStatus {
  isActive: boolean
  isToday: boolean
  effectivePrice: number | null
  regularPrice: number | null
  happyHourPrice: number | null
  happyHourLabel: string | null // e.g. "Happy Hour 5-6pm"
  minutesRemaining: number | null
  startsInMinutes: number | null
  countdown: string | null
}

export function getHappyHourStatus(pub: {
  price: number | null
  happyHourPrice?: number | null
  happyHourDays?: string | null
  happyHourStart?: string | null
  happyHourEnd?: string | null
}, now: Date = new Date()): HappyHourStatus {
  const regularPrice = pub.price
  const hhPrice = pub.happyHourPrice ?? null
  const hhDays = pub.happyHourDays ?? null
  const hhStart = pub.happyHourStart ?? null
  const hhEnd = pub.happyHourEnd ?? null
  
  // No happy hour timing data - can't determine if active
  if (!hhDays || !hhStart || !hhEnd) {
    return {
      isActive: false,
      isToday: false,
      effectivePrice: regularPrice,
      regularPrice,
      happyHourPrice: hhPrice,
      happyHourLabel: null,
      minutesRemaining: null,
      startsInMinutes: null,
      countdown: null,
    }
  }
  
  const perth = perthNow(now)
  const currentDay = perth.dayOfWeek
  const currentMinutes = perth.minutesOfDay
  
  const activeDays = parseDayRange(hhDays)
  const startTime = parseTime(hhStart)
  const endTime = parseTime(hhEnd)
  
  if (!startTime || !endTime) {
    return {
      isActive: false,
      isToday: false,
      effectivePrice: regularPrice,
      regularPrice,
      happyHourPrice: hhPrice,
      happyHourLabel: null,
      minutesRemaining: null,
      startsInMinutes: null,
      countdown: null,
    }
  }
  
  const startMinutes = startTime.hours * 60 + startTime.minutes
  const endMinutes = endTime.hours * 60 + endTime.minutes
  
  const isDayActive = activeDays.includes(currentDay)
  const isTimeActive = currentMinutes >= startMinutes && currentMinutes < endMinutes
  const isActive = isDayActive && isTimeActive
  const startsInMinutes = isDayActive && currentMinutes < startMinutes ? startMinutes - currentMinutes : null
  const isToday = isActive || startsInMinutes !== null
  
  // Format label
  const formatHour = (h: number, m: number) => {
    const period = h >= 12 ? 'pm' : 'am'
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return m > 0 ? `${hour12}:${String(m).padStart(2, '0')}${period}` : `${hour12}${period}`
  }
  
  const formatDays = (days: string): string => {
    // Handle postgres array format: {Mon,Tue,Wed,...}
    if (days.startsWith('{') && days.endsWith('}')) {
      const dayList = days.slice(1, -1).split(',').map(d => d.trim())
      const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      if (dayList.length === 7) return '7 days'
      if (dayList.length === 5 && ['Mon','Tue','Wed','Thu','Fri'].every(d => dayList.includes(d))) return 'Mon-Fri'
      if (dayList.length === 2 && dayList.includes('Sat') && dayList.includes('Sun')) return 'Weekends'
      // Check for consecutive range
      const indices = dayList.map(d => allDays.indexOf(d)).filter(i => i >= 0).sort((a,b) => a-b)
      if (indices.length > 2) {
        const isConsecutive = indices.every((v, i) => i === 0 || v === indices[i-1] + 1)
        if (isConsecutive) return `${allDays[indices[0]]}-${allDays[indices[indices.length-1]]}`
      }
      return dayList.join(', ')
    }
    return days
  }

  const label = `${formatDays(hhDays)} ${formatHour(startTime.hours, startTime.minutes)}-${formatHour(endTime.hours, endTime.minutes)}`
  
  const minutesRemaining = isActive ? endMinutes - currentMinutes : null
  const countdown = minutesRemaining != null
    ? formatDuration(minutesRemaining, 'left')
    : startsInMinutes != null
      ? formatDuration(startsInMinutes, 'until')
      : null
  
  return {
    isActive,
    isToday,
    effectivePrice: isActive && hhPrice ? hhPrice : regularPrice,
    regularPrice,
    happyHourPrice: hhPrice,
    happyHourLabel: label,
    minutesRemaining,
    startsInMinutes,
    countdown,
  }
}

function formatDuration(minutes: number, mode: 'left' | 'until'): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mode === 'until') {
    return hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`
  }
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`
}
