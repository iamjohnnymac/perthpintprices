import { getHappyHourStatus } from '@/lib/happyHourLive'
import { perthToday } from '@/lib/perthClock'
import { anonClient } from '@/lib/supabaseGateway'

export interface PintOfTheDayPub {
  id: number
  name: string
  slug: string
  suburb: string
  address: string | null
  price: number | string
  beer_type: string | null
  happy_hour: string | null
  happy_hour_price: number | string | null
  happy_hour_days: string | null
  happy_hour_start: string | null
  happy_hour_end: string | null
  image_url: string | null
}

export interface PintOfTheDayData {
  date: string
  pub: {
    name: string
    slug: string
    suburb: string
    address: string | null
    price: number
    effectivePrice: number
    beerType: string | null
    happyHour: string | null
    isHappyHourNow: boolean
    imageUrl: string | null
  }
  reason: string
  runnerUp: {
    name: string
    slug: string
    suburb: string
    price: number
  } | null
}

const PINT_OF_THE_DAY_COLUMNS = 'id, name, slug, suburb, price, beer_type, address, happy_hour, happy_hour_price, happy_hour_days, happy_hour_start, happy_hour_end, image_url'

/**
 * Deterministically selects a daily pint from a supplied, verified-price list.
 * Both the page and API call this contract so their daily decision cannot drift.
 */
export function selectPintOfTheDay(pubs: PintOfTheDayPub[], now: Date = new Date()): PintOfTheDayData | null {
  if (pubs.length === 0) return null

  const date = perthToday(now)
  const seed = date.split('-').reduce((total, value) => total + Number(value), 0)
  const canonicalPubs = [...pubs].sort((a, b) =>
    Number(a.price) - Number(b.price)
    || a.id - b.id
    || a.slug.localeCompare(b.slug),
  )
  const prices = canonicalPubs.map(pub => Number(pub.price))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  const scored = canonicalPubs.map((pub, index) => {
    let score = ((maxPrice - Number(pub.price)) / priceRange) * 50

    if (pub.happy_hour_days && pub.happy_hour_start) {
      score += 15
      if (pub.happy_hour_price) score += 10
    }

    const tier = index % 10
    const targetTier = seed % 10
    if (tier === targetTier) score += 25
    if (Math.abs(tier - targetTier) <= 1) score += 10

    return { pub, score }
  })

  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.5) {
      return ((b.pub.id * seed) % 1000) - ((a.pub.id * seed) % 1000)
    }
    return b.score - a.score
  })

  const winner = scored[0].pub
  const runnerUp = scored[1]?.pub
  const happyHour = getHappyHourStatus({
    price: Number(winner.price),
    happyHourPrice: winner.happy_hour_price == null ? null : Number(winner.happy_hour_price),
    happyHourDays: winner.happy_hour_days,
    happyHourStart: winner.happy_hour_start,
    happyHourEnd: winner.happy_hour_end,
  }, now)

  const reasons: string[] = []
  if ((happyHour.effectivePrice ?? Number(winner.price)) <= 7) reasons.push("One of Perth's cheapest pints")
  else if ((happyHour.effectivePrice ?? Number(winner.price)) <= 9) reasons.push('Great value pint')
  if (happyHour.isActive) reasons.push('Happy hour is on right now')
  else if (winner.happy_hour_days) reasons.push('Has happy hour specials')
  if (winner.beer_type) reasons.push(`Pouring ${winner.beer_type}`)

  return {
    date,
    pub: {
      name: winner.name,
      slug: winner.slug,
      suburb: winner.suburb,
      address: winner.address,
      price: Number(winner.price),
      effectivePrice: happyHour.effectivePrice ?? Number(winner.price),
      beerType: winner.beer_type,
      happyHour: winner.happy_hour,
      isHappyHourNow: happyHour.isActive,
      imageUrl: winner.image_url,
    },
    reason: reasons[0] || 'Top value pick for today',
    runnerUp: runnerUp ? {
      name: runnerUp.name,
      slug: runnerUp.slug,
      suburb: runnerUp.suburb,
      price: Number(runnerUp.price),
    } : null,
  }
}

/** Server data seam used by both the page and the API route. */
export async function getPintOfTheDay(now: Date = new Date()): Promise<PintOfTheDayData | null> {
  const { data, error } = await anonClient()
    .from('pubs')
    .select(PINT_OF_THE_DAY_COLUMNS)
    .eq('price_verified', true)
    .not('price', 'is', null)
    .order('price', { ascending: true })

  if (error) throw error
  return selectPintOfTheDay((data || []) as PintOfTheDayPub[], now)
}
