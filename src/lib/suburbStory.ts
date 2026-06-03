import { seededVariant } from '@/lib/seededVariant'
import type { SuburbInfo } from '@/lib/supabase'
import type { Pub } from '@/types/pub'

export interface SuburbStoryCard {
  id: 'spread' | 'average' | 'coverage' | 'happy-hour' | 'nearby'
  label: string
  title: string
  body: string
  href?: string
  linkLabel?: string
}

export interface SuburbStoryFaq {
  question: string
  answer: string
}

export interface CheaperNearbySuburb {
  name: string
  slug: string
  avgPrice: number | null
  cheapestPrice: number | null
  verifiedCount: number
}

export interface SuburbStory {
  verifiedPubs: Pub[]
  verifiedCount: number
  missingCount: number
  coveragePercent: number
  suburbAvgPrice: number | null
  minPrice: number | null
  maxPrice: number | null
  cheapestPub: Pub | null
  happyHourCount: number
  activeHappyHourCount: number
  cheaperNearbySuburbs: CheaperNearbySuburb[]
  cards: SuburbStoryCard[]
  faqs: SuburbStoryFaq[]
}

interface SuburbStoryInput {
  suburb: SuburbInfo
  pubs: Pub[]
  nearbySuburbs: SuburbInfo[]
  perthAvgPrice: number
  suburbSlug: string
}

function money(value: number): string {
  return `$${value.toFixed(2).replace(/\.00$/, '')}`
}

function numericPrice(price: string | number | null | undefined): number | null {
  if (price == null || price === 'TBC') return null
  const value = Number(price)
  return Number.isFinite(value) && value > 0 ? value : null
}

function priceWord(delta: number): string {
  if (Math.abs(delta) < 0.25) return 'about level with'
  return delta < 0 ? 'under' : 'over'
}

function joinNames(items: { name: string }[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0].name
  return `${items.slice(0, -1).map(item => item.name).join(', ')} and ${items[items.length - 1].name}`
}

function question(seed: string, kind: 'cheapest' | 'average' | 'happyHour' | 'nearby' | 'missing', suburbName: string): string {
  const pools = {
    cheapest: [
      `Where is the cheapest verified pint in ${suburbName}?`,
      `What is the cheapest pint we have checked in ${suburbName}?`,
      `Which ${suburbName} pub is cheapest right now?`,
    ],
    average: [
      `Is ${suburbName} cheaper than the Perth average?`,
      `How does ${suburbName} compare with Perth overall?`,
      `Is a pint in ${suburbName} dear by Perth standards?`,
    ],
    happyHour: [
      `Are there happy hours in ${suburbName}?`,
      `Which ${suburbName} pubs list happy hours?`,
      `Can I find a happy-hour pint in ${suburbName}?`,
    ],
    nearby: [
      `Where is cheaper near ${suburbName}?`,
      `Are nearby suburbs better value than ${suburbName}?`,
      `What should I check near ${suburbName}?`,
    ],
    missing: [
      `Why are prices missing in ${suburbName}?`,
      `Why are some ${suburbName} pubs marked TBC?`,
      `How complete is the ${suburbName} price list?`,
    ],
  } as const

  return seededVariant(`${seed}:${kind}`, pools[kind])
}

export function getSuburbStory(input: SuburbStoryInput): SuburbStory {
  const { suburb, pubs, nearbySuburbs, perthAvgPrice, suburbSlug } = input
  const verifiedPubs = pubs
    .filter(pub => pub.regularPrice !== null && pub.regularPrice > 0 && pub.priceVerified)
    .sort((a, b) => (a.regularPrice ?? Number.MAX_VALUE) - (b.regularPrice ?? Number.MAX_VALUE))
  const verifiedCount = verifiedPubs.length
  const missingCount = Math.max(pubs.length - verifiedCount, 0)
  const coveragePercent = pubs.length > 0 ? Math.round((verifiedCount / pubs.length) * 100) : 0
  const prices = verifiedPubs.map(pub => pub.regularPrice as number)
  const suburbAvgPrice = prices.length > 0
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length
    : null
  const minPrice = prices.length > 0 ? prices[0] : null
  const maxPrice = prices.length > 0 ? prices[prices.length - 1] : null
  const cheapestPub = verifiedPubs[0] ?? null
  const happyHourPubs = pubs.filter(pub => pub.happyHour && pub.happyHour.trim() !== '')
  const activeHappyHourCount = pubs.filter(pub => pub.isHappyHourNow).length
  const happyHourCount = happyHourPubs.length
  const nearbyWithPrices = nearbySuburbs
    .map(ns => ({
      name: ns.name,
      slug: ns.slug,
      avgPrice: numericPrice(ns.avgPrice),
      cheapestPrice: numericPrice(ns.cheapestPrice),
      verifiedCount: ns.verifiedCount,
    }))
    .filter(ns => ns.verifiedCount > 0 && (ns.avgPrice !== null || ns.cheapestPrice !== null))
  const cheaperNearbySuburbs = nearbyWithPrices
    .filter(ns => (
      (suburbAvgPrice !== null && ns.avgPrice !== null && ns.avgPrice < suburbAvgPrice) ||
      (minPrice !== null && ns.cheapestPrice !== null && ns.cheapestPrice < minPrice)
    ))
    .sort((a, b) => (a.avgPrice ?? a.cheapestPrice ?? Number.MAX_VALUE) - (b.avgPrice ?? b.cheapestPrice ?? Number.MAX_VALUE))
    .slice(0, 2)

  const cards: SuburbStoryCard[] = []

  if (verifiedCount >= 2 && minPrice !== null && maxPrice !== null && suburbAvgPrice !== null) {
    const spread = maxPrice - minPrice
    cards.push({
      id: 'spread',
      label: 'Price spread',
      title: `${money(minPrice)} to ${money(maxPrice)}`,
      body: spread >= 2
        ? `The checked pints in ${suburb.name} span ${money(spread)}. Pick the pub, not just the suburb.`
        : `The checked pints in ${suburb.name} sit in a tight ${money(spread)} band, which is tidy work.`
      ,
      href: cheapestPub ? `/${suburbSlug}/${cheapestPub.slug}` : undefined,
      linkLabel: cheapestPub ? `${cheapestPub.name} is lowest` : undefined,
    })
  } else if (verifiedCount === 1 && cheapestPub && minPrice !== null) {
    cards.push({
      id: 'spread',
      label: 'Checked price',
      title: `One at ${money(minPrice)}`,
      body: `Only ${cheapestPub.name} has a verified pint price here so far. Useful as a starting point, not a suburb average.`,
      href: `/${suburbSlug}/${cheapestPub.slug}`,
      linkLabel: `See ${cheapestPub.name}`,
    })
  } else {
    cards.push({
      id: 'spread',
      label: 'Checked price',
      title: 'No verified pint yet',
      body: `${suburb.name} is on the map, but no pub here has a checked pint price yet. Better blank than made up.`,
    })
  }

  if (suburbAvgPrice !== null && verifiedCount >= 2 && perthAvgPrice > 0) {
    const delta = suburbAvgPrice - perthAvgPrice
    const relation = priceWord(delta)
    cards.push({
      id: 'average',
      label: 'Suburb average',
      title: money(suburbAvgPrice),
      body: relation === 'about level with'
        ? `${suburb.name} is about level with Perth's checked average of ${money(perthAvgPrice)}.`
        : `${suburb.name} sits ${money(Math.abs(delta))} ${relation} Perth's checked average of ${money(perthAvgPrice)}.`,
    })
  }

  if (happyHourCount > 0) {
    const activeLine = activeHappyHourCount > 0
      ? `${activeHappyHourCount} ${activeHappyHourCount === 1 ? 'is' : 'are'} running right now.`
      : 'None are live at this minute.'
    cards.push({
      id: 'happy-hour',
      label: 'Happy hours',
      title: `${happyHourCount} ${happyHourCount === 1 ? 'venue' : 'venues'}`,
      body: `${happyHourCount} ${happyHourCount === 1 ? 'pub lists' : 'pubs list'} a happy-hour window. ${activeLine}`,
    })
  } else {
    cards.push({
      id: 'happy-hour',
      label: 'Happy hours',
      title: 'None logged',
      body: `No ${suburb.name} happy-hour windows are in the database yet. That may mean quiet data, not quiet taps.`,
    })
  }

  if (missingCount > 0) {
    cards.push({
      id: 'coverage',
      label: 'Coverage',
      title: `${missingCount} still TBC`,
      body: `${verifiedCount} of ${pubs.length} ${pubs.length === 1 ? 'venue has' : 'venues have'} a verified pint price. The rest stay marked TBC until checked.`,
    })
  } else if (pubs.length > 0) {
    cards.push({
      id: 'coverage',
      label: 'Coverage',
      title: `${coveragePercent}% checked`,
      body: `Every tracked ${suburb.name} venue on this page has a checked pint price.`,
    })
  }

  if (cheaperNearbySuburbs.length > 0) {
    const names = joinNames(cheaperNearbySuburbs)
    const first = cheaperNearbySuburbs[0]
    cards.push({
      id: 'nearby',
      label: 'Nearby check',
      title: names,
      body: `${names} ${cheaperNearbySuburbs.length === 1 ? 'has' : 'have'} a lower checked price signal nearby.`,
      href: `/${first.slug}`,
      linkLabel: `See ${first.name}`,
    })
  } else if (nearbyWithPrices.length > 0 && verifiedCount > 0) {
    cards.push({
      id: 'nearby',
      label: 'Nearby check',
      title: 'No cheaper neighbour',
      body: `The nearest checked suburbs we have do not beat ${suburb.name} on the current price data.`,
    })
  } else if (nearbyWithPrices.length > 0) {
    const checkedNearby = nearbyWithPrices.slice(0, 2)
    const names = joinNames(checkedNearby)
    const first = checkedNearby[0]
    cards.push({
      id: 'nearby',
      label: 'Nearby check',
      title: names,
      body: `${names} ${checkedNearby.length === 1 ? 'has' : 'have'} checked prices nearby while ${suburb.name} is still TBC.`,
      href: `/${first.slug}`,
      linkLabel: `See ${first.name}`,
    })
  }

  const faqs: SuburbStoryFaq[] = []

  if (cheapestPub && minPrice !== null) {
    faqs.push({
      question: question(suburb.slug, 'cheapest', suburb.name),
      answer: `${cheapestPub.name} is the cheapest verified pint we have in ${suburb.name} at ${money(minPrice)}.`,
    })
  } else {
    faqs.push({
      question: question(suburb.slug, 'missing', suburb.name),
      answer: `No ${suburb.name} pub has a verified pint price yet. Pubs stay TBC until a price is reported or checked.`,
    })
  }

  if (suburbAvgPrice !== null && verifiedCount >= 2 && perthAvgPrice > 0) {
    const delta = suburbAvgPrice - perthAvgPrice
    const relation = priceWord(delta)
    faqs.push({
      question: question(suburb.slug, 'average', suburb.name),
      answer: relation === 'about level with'
        ? `${suburb.name}'s checked average is ${money(suburbAvgPrice)}, about level with Perth's ${money(perthAvgPrice)} average.`
        : `${suburb.name}'s checked average is ${money(suburbAvgPrice)}, ${money(Math.abs(delta))} ${relation} Perth's ${money(perthAvgPrice)} average.`,
    })
  }

  faqs.push({
    question: question(suburb.slug, 'happyHour', suburb.name),
    answer: happyHourCount > 0
      ? `${happyHourCount} ${happyHourCount === 1 ? 'pub lists' : 'pubs list'} a happy-hour window in ${suburb.name}${activeHappyHourCount > 0 ? `, with ${activeHappyHourCount} live right now` : ''}.`
      : `No happy-hour windows are logged for ${suburb.name} yet.`,
  })

  if (cheaperNearbySuburbs.length > 0) {
    const names = joinNames(cheaperNearbySuburbs)
    faqs.push({
      question: question(suburb.slug, 'nearby', suburb.name),
      answer: `${names} ${cheaperNearbySuburbs.length === 1 ? 'is' : 'are'} worth checking nearby on current verified prices.`,
    })
  } else if (nearbyWithPrices.length > 0 && verifiedCount > 0) {
    faqs.push({
      question: question(suburb.slug, 'nearby', suburb.name),
      answer: `Among the closest suburbs with checked prices, none currently show a cheaper signal than ${suburb.name}.`,
    })
  } else if (nearbyWithPrices.length > 0) {
    const checkedNearby = nearbyWithPrices.slice(0, 2)
    const names = joinNames(checkedNearby)
    faqs.push({
      question: question(suburb.slug, 'nearby', suburb.name),
      answer: `${names} ${checkedNearby.length === 1 ? 'has' : 'have'} checked pint prices nearby while ${suburb.name} is still TBC.`,
    })
  }

  return {
    verifiedPubs,
    verifiedCount,
    missingCount,
    coveragePercent,
    suburbAvgPrice,
    minPrice,
    maxPrice,
    cheapestPub,
    happyHourCount,
    activeHappyHourCount,
    cheaperNearbySuburbs,
    cards,
    faqs,
  }
}
