import { Pub } from '@/types/pub'
import { absolutePubUrl, absoluteSuburbUrl, BASE_URL, toSuburbSlug } from './urls'

type JsonLdNode = Record<string, unknown>

const DAY_URLS: Record<string, string> = {
  mon: 'https://schema.org/Monday',
  monday: 'https://schema.org/Monday',
  tue: 'https://schema.org/Tuesday',
  tuesday: 'https://schema.org/Tuesday',
  wed: 'https://schema.org/Wednesday',
  wednesday: 'https://schema.org/Wednesday',
  thu: 'https://schema.org/Thursday',
  thursday: 'https://schema.org/Thursday',
  fri: 'https://schema.org/Friday',
  friday: 'https://schema.org/Friday',
  sat: 'https://schema.org/Saturday',
  saturday: 'https://schema.org/Saturday',
  sun: 'https://schema.org/Sunday',
  sunday: 'https://schema.org/Sunday',
}

const ORDERED_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function toIsoDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function parseHappyHourDays(days: string | null): string[] {
  if (!days) return []

  const normalized = days.trim().toLowerCase()
  if (['7 days', 'daily', 'everyday', 'every day'].includes(normalized)) {
    return ORDERED_DAY_KEYS.map(day => DAY_URLS[day])
  }

  const rawDays = normalized.startsWith('{') && normalized.endsWith('}')
    ? normalized.slice(1, -1).split(',').map(day => day.trim())
    : normalized.includes('-')
      ? expandDayRange(normalized)
      : normalized.split(',').map(day => day.trim())

  return rawDays
    .map(day => DAY_URLS[day] || DAY_URLS[day.slice(0, 3)])
    .filter((day): day is string => Boolean(day))
}

function expandDayRange(range: string): string[] {
  const [startRaw, endRaw] = range.split('-').map(day => day.trim().slice(0, 3))
  const start = ORDERED_DAY_KEYS.indexOf(startRaw)
  const end = ORDERED_DAY_KEYS.indexOf(endRaw)
  if (start === -1 || end === -1) return []

  const days: string[] = []
  let current = start
  while (true) {
    days.push(ORDERED_DAY_KEYS[current])
    if (current === end) break
    current = (current + 1) % ORDERED_DAY_KEYS.length
  }
  return days
}

function toSchemaTime(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null
  const parsedHours = Number(match[1])
  const parsedMinutes = Number(match[2])
  const parsedSeconds = Number(match[3] || '0')
  if (
    parsedHours < 0 || parsedHours > 23
    || parsedMinutes < 0 || parsedMinutes > 59
    || parsedSeconds < 0 || parsedSeconds > 59
  ) {
    return null
  }
  const hours = match[1].padStart(2, '0')
  const minutes = match[2]
  const seconds = match[3] || '00'
  return `${hours}:${minutes}:${seconds}`
}

function buildHappyHourOpeningHours(pub: Pub): JsonLdNode | null {
  const dayOfWeek = parseHappyHourDays(pub.happyHourDays)
  const opens = toSchemaTime(pub.happyHourStart)
  const closes = toSchemaTime(pub.happyHourEnd)

  if (dayOfWeek.length === 0 || !opens || !closes) return null

  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek,
    opens,
    closes,
  }
}

// Regular trading hours from the Places (New) backfill → one spec per period.
// day 0..6 = Sun..Sat (Places convention, matches ORDERED_DAY_KEYS).
function buildRegularOpeningHours(pub: Pub): JsonLdNode[] {
  const periods = pub.googleOpeningHours?.periods
  if (!Array.isArray(periods)) return []

  const specs: JsonLdNode[] = []
  for (const period of periods) {
    const open = period?.open
    const close = period?.close
    if (!open || !close) continue
    const dayKey = ORDERED_DAY_KEYS[open.day]
    const dayOfWeek = dayKey ? DAY_URLS[dayKey] : null
    if (!dayOfWeek) continue
    const opens = toSchemaTime(`${open.hour}:${String(open.minute).padStart(2, '0')}`)
    const closes = toSchemaTime(`${close.hour}:${String(close.minute).padStart(2, '0')}`)
    if (!opens || !closes) continue
    specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes })
  }
  return specs
}

// LocationFeatureSpecification list from the sourced Places attributes. Only
// emits features Google affirms as true — no invented or false-valued features.
const AMENITY_LABELS: Array<[keyof Pub, string]> = [
  ['servesBeer', 'Serves beer'],
  ['servesFood', 'Serves food'],
  ['outdoorSeating', 'Outdoor seating'],
  ['goodForChildren', 'Family friendly'],
  ['goodForGroups', 'Good for groups'],
  ['goodForWatchingSports', 'Sports on TV'],
  ['allowsDogs', 'Dog friendly'],
  ['liveMusic', 'Live music'],
  ['restroom', 'Restroom'],
  ['reservable', 'Accepts reservations'],
]

function buildAmenityFeatures(pub: Pub): JsonLdNode[] {
  return AMENITY_LABELS
    .filter(([key]) => pub[key] === true)
    .map(([, name]) => ({ '@type': 'LocationFeatureSpecification', name, value: true }))
}

// The actual pint price(s) as Offers — the whole point of the site, made
// machine-readable (rich results / AI answers). Standard pint + happy-hour pint.
function buildOffers(pub: Pub): JsonLdNode[] {
  const offers: JsonLdNode[] = []
  const itemName = pub.beerType ? `Pint (${pub.beerType})` : 'Pint of beer'
  if (typeof pub.regularPrice === 'number' && pub.regularPrice > 0) {
    offers.push({
      '@type': 'Offer',
      name: 'Pint',
      price: pub.regularPrice.toFixed(2),
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      itemOffered: { '@type': 'MenuItem', name: itemName },
    })
  }
  if (typeof pub.happyHourPrice === 'number' && pub.happyHourPrice > 0) {
    offers.push({
      '@type': 'Offer',
      name: 'Happy hour pint',
      price: pub.happyHourPrice.toFixed(2),
      priceCurrency: 'AUD',
      itemOffered: { '@type': 'MenuItem', name: itemName },
    })
  }
  return offers
}

function buildPriceRange(price: number | null, avgPrice: number): string | null {
  if (price === null || price <= 0) return null
  if (avgPrice > 0) {
    if (price < avgPrice * 0.85) return '$'
    if (price <= avgPrice * 1.15) return '$$'
    return '$$$'
  }
  if (price < 8) return '$'
  if (price <= 12) return '$$'
  return '$$$'
}

export function buildPubJsonLd(pub: Pub, avgPrice: number): JsonLdNode {
  const suburbSlug = toSuburbSlug(pub.suburb)
  const canonical = absolutePubUrl(pub)
  const webpageId = `${canonical}#webpage`
  const pubId = `${canonical}#pub`
  const breadcrumbId = `${canonical}#breadcrumb`
  const dateModified = toIsoDate(pub.lastVerified)
  const priceRange = buildPriceRange(pub.regularPrice ?? pub.price, avgPrice)
  const happyHourSpec = buildHappyHourOpeningHours(pub)
  const openingHoursSpecification = [...buildRegularOpeningHours(pub), ...(happyHourSpec ? [happyHourSpec] : [])]
  const amenityFeature = buildAmenityFeatures(pub)
  // Canonical Google Business Profile URL built from the stored place_id — the
  // stable, official form for linking to a place (Google Maps URLs spec).
  const googlePlaceUrl = pub.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(pub.placeId)}`
    : null

  const barOrPub: JsonLdNode = {
    '@type': 'BarOrPub',
    '@id': pubId,
    name: pub.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: pub.address,
      addressLocality: pub.suburb,
      addressRegion: 'WA',
      addressCountry: 'AU',
    },
  }

  const hasGeo = Number.isFinite(pub.lat) && Number.isFinite(pub.lng) && pub.lat !== 0 && pub.lng !== 0
  if (hasGeo) {
    barOrPub.geo = {
      '@type': 'GeoCoordinates',
      latitude: pub.lat,
      longitude: pub.lng,
    }
  }

  // Map link prefers the canonical Google listing (from place_id); falls back to a
  // lat/lng search when we only have coordinates.
  if (googlePlaceUrl) {
    barOrPub.hasMap = googlePlaceUrl
  } else if (hasGeo) {
    barOrPub.hasMap = `https://www.google.com/maps/search/?api=1&query=${pub.lat},${pub.lng}`
  }

  // sameAs reconciles this pub to its authoritative Google Business Profile — the
  // entity signal linking our page to the pub's real-world listing.
  if (googlePlaceUrl) barOrPub.sameAs = [googlePlaceUrl]

  if (pub.website) barOrPub.url = pub.website
  if (pub.phone) barOrPub.telephone = pub.phone
  // Google Places photo as the entity image — a strong local rich-result signal.
  // ImageObject carries the required contributor credit into the structured data.
  if (pub.googlePhotoUrl) {
    barOrPub.image = pub.googlePhotoAttribution
      ? {
          '@type': 'ImageObject',
          url: pub.googlePhotoUrl,
          creditText: pub.googlePhotoAttribution,
          ...(pub.googlePhotoAttributionUri ? { author: { '@type': 'Person', name: pub.googlePhotoAttribution, url: pub.googlePhotoAttributionUri } } : {}),
        }
      : pub.googlePhotoUrl
  } else if (pub.imageUrl) {
    // Manually-supplied photo (venue-provided or own) when Google has none.
    barOrPub.image = pub.imageUrl
  }
  if (priceRange) barOrPub.priceRange = priceRange
  if (openingHoursSpecification.length > 0) {
    barOrPub.openingHoursSpecification = openingHoursSpecification
  }
  if (amenityFeature.length > 0) {
    barOrPub.amenityFeature = amenityFeature
  }
  const offers = buildOffers(pub)
  if (offers.length > 0) {
    barOrPub.makesOffer = offers
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: `${pub.name} pint prices in ${pub.suburb}`,
        mainEntity: { '@id': pubId },
        breadcrumb: { '@id': breadcrumbId },
        ...(dateModified ? { dateModified } : {}),
      },
      barOrPub,
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: pub.suburb, item: absoluteSuburbUrl(suburbSlug) },
          { '@type': 'ListItem', position: 3, name: pub.name, item: canonical },
        ],
      },
    ],
  }
}
