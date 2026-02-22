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

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

function getPerthNow(): Date {
  // Get current time in Perth (UTC+8)
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 8 * 3600000)
}

function parseDayRange(days: string): number[] {
  const d = days.toLowerCase().trim()
  
  // All week
  if (d === '7 days' || d === 'daily' || d === 'everyday' || d === 'every day') {
    return [0, 1, 2, 3, 4, 5, 6]
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
  effectivePrice: number | null
  regularPrice: number | null
  happyHourPrice: number | null
  happyHourLabel: string | null // e.g. "Happy Hour 5-6pm"
  minutesRemaining: number | null
}

export function getHappyHourStatus(pub: {
  price: number | null
  happyHourPrice?: number | null
  happyHourDays?: string | null
  happyHourStart?: string | null
  happyHourEnd?: string | null
}): HappyHourStatus {
  const regularPrice = pub.price
  const hhPrice = pub.happyHourPrice ?? null
  const hhDays = pub.happyHourDays ?? null
  const hhStart = pub.happyHourStart ?? null
  const hhEnd = pub.happyHourEnd ?? null
  
  // No happy hour data
  if (!hhPrice || !hhDays || !hhStart || !hhEnd) {
    return {
      isActive: false,
      effectivePrice: regularPrice,
      regularPrice,
      happyHourPrice: null,
      happyHourLabel: null,
      minutesRemaining: null,
    }
  }
  
  const now = getPerthNow()
  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const activeDays = parseDayRange(hhDays)
  const startTime = parseTime(hhStart)
  const endTime = parseTime(hhEnd)
  
  if (!startTime || !endTime) {
    return {
      isActive: false,
      effectivePrice: regularPrice,
      regularPrice,
      happyHourPrice: hhPrice,
      happyHourLabel: null,
      minutesRemaining: null,
    }
  }
  
  const startMinutes = startTime.hours * 60 + startTime.minutes
  const endMinutes = endTime.hours * 60 + endTime.minutes
  
  const isDayActive = activeDays.includes(currentDay)
  const isTimeActive = currentMinutes >= startMinutes && currentMinutes < endMinutes
  const isActive = isDayActive && isTimeActive
  
  // Format label
  const formatHour = (h: number, m: number) => {
    const period = h >= 12 ? 'pm' : 'am'
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return m > 0 ? `${hour12}:${String(m).padStart(2, '0')}${period}` : `${hour12}${period}`
  }
  
  const label = `${hhDays} ${formatHour(startTime.hours, startTime.minutes)}-${formatHour(endTime.hours, endTime.minutes)}`
  
  const minutesRemaining = isActive ? endMinutes - currentMinutes : null
  
  return {
    isActive,
    effectivePrice: isActive ? hhPrice : regularPrice,
    regularPrice,
    happyHourPrice: hhPrice,
    happyHourLabel: label,
    minutesRemaining,
  }
}
