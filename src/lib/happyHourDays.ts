export const HAPPY_HOUR_DAYS = [
  { slug: 'sunday', label: 'Sunday', index: 0 },
  { slug: 'monday', label: 'Monday', index: 1 },
  { slug: 'tuesday', label: 'Tuesday', index: 2 },
  { slug: 'wednesday', label: 'Wednesday', index: 3 },
  { slug: 'thursday', label: 'Thursday', index: 4 },
  { slug: 'friday', label: 'Friday', index: 5 },
  { slug: 'saturday', label: 'Saturday', index: 6 },
] as const

export type HappyHourDay = typeof HAPPY_HOUR_DAYS[number]

const DAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}

export function getHappyHourDayBySlug(slug: string): HappyHourDay | null {
  return HAPPY_HOUR_DAYS.find(day => day.slug === slug) ?? null
}

export function parseHappyHourDayIndexes(days: string | null): number[] {
  if (!days) return []
  const clean = days.replace(/[{}]/g, '').toLowerCase().trim()
  if (['7 days', 'daily', 'everyday', 'every day'].includes(clean)) return [0, 1, 2, 3, 4, 5, 6]
  if (clean === 'weekdays') return [1, 2, 3, 4, 5]
  if (clean === 'weekends') return [0, 6]

  const parsedDays: number[] = []
  const parts = clean
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)

  for (const part of parts) {
    const rangeMatch = part.match(/^(\w{3,})[-–](\w{3,})$/)
    if (rangeMatch) {
      const start = DAY_MAP[rangeMatch[1].slice(0, 3)]
      const end = DAY_MAP[rangeMatch[2].slice(0, 3)]
      if (start !== undefined && end !== undefined) {
        let current = start
        while (current !== (end + 1) % 7) {
          parsedDays.push(current)
          current = (current + 1) % 7
        }
      }
      continue
    }

    const day = DAY_MAP[part] ?? DAY_MAP[part.slice(0, 3)]
    if (day !== undefined) parsedDays.push(day)
  }

  return Array.from(new Set(parsedDays))
}

export function pubHasHappyHourOnDay(days: string | null, dayIndex: number): boolean {
  return parseHappyHourDayIndexes(days).includes(dayIndex)
}
