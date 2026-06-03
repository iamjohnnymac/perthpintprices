import type { Pub } from '@/types/pub'
import { haversineDistanceKm } from '@/lib/location'

export type TransportHub = {
  slug: string
  name: string
  shortName: string
  nearbyLabel: string
  lat: number
  lng: number
  radiusKm: number
  intro: string
  answerNote: string
  timingNote: string
}

export type TransportHubPub = Pub & {
  distanceKm: number
}

export const TRANSPORT_HUBS = [
  {
    slug: 'pubs-near-perth-station',
    name: 'Perth Station',
    shortName: 'Perth Station',
    nearbyLabel: 'near Perth Station',
    lat: -31.9514,
    lng: 115.8605,
    radiusKm: 1.1,
    intro: 'Perth Station is the practical pub filter: close enough for one more, central enough that nobody has to perform a suburb argument on the footpath. This page ranks nearby pubs by direct proximity first, then shows the verified pint price where we have one.',
    answerNote: 'Best for pre-train pints, after-work meetups, and the “I am not crossing the city for this” sort of plan.',
    timingNote: 'Allow more time on event nights and Friday peaks; the nearest dot is not always the quickest bar order.',
  },
  {
    slug: 'pubs-near-optus-stadium',
    name: 'Optus Stadium',
    shortName: 'Optus Stadium',
    nearbyLabel: 'near Optus Stadium',
    lat: -31.951,
    lng: 115.889,
    radiusKm: 1.8,
    intro: 'Optus Stadium creates a very specific drinking problem: everyone wants somewhere close, nobody wants to discover the crowd at the same time. This page keeps the search boring in the useful way: nearby pubs first, checked prices where we have them, and enough suburb context to pick before the bounce-down rush.',
    answerNote: 'Best for pre-game and post-game plans around Burswood, East Perth, and the river crossings.',
    timingNote: 'On stadium nights, choose earlier than feels necessary. The crowd has also seen the fixture.',
  },
  {
    slug: 'pubs-near-rac-arena',
    name: 'RAC Arena',
    shortName: 'RAC Arena',
    nearbyLabel: 'near RAC Arena',
    lat: -31.9483,
    lng: 115.8524,
    radiusKm: 1.1,
    intro: 'RAC Arena nights need a pub that works before doors, after the encore, or during the part where someone claims they know a shortcut. The list below keeps it tight around the arena and shows the regular pint price where the row has been checked.',
    answerNote: 'Best for concerts, basketball nights, and CBD plans where the meeting point needs to survive group chat.',
    timingNote: 'The useful window is usually before doors or twenty minutes after the first crowd wave leaves.',
  },
  {
    slug: 'pubs-near-elizabeth-quay',
    name: 'Elizabeth Quay',
    shortName: 'Elizabeth Quay',
    nearbyLabel: 'near Elizabeth Quay',
    lat: -31.9586,
    lng: 115.8582,
    radiusKm: 1.1,
    intro: 'Elizabeth Quay is lovely until the plan becomes "somewhere nearby" and everyone starts rotating on the spot. This page turns the riverfront pub search into a ranked list: nearest useful venues first, verified regular pint prices where we have them, and enough detail to avoid wandering uphill for no reason.',
    answerNote: 'Best for riverfront meetups, ferry-adjacent plans, and CBD drinks that do not need a spreadsheet.',
    timingNote: 'Expect the waterfront to move slowly in good weather. That is not a complaint, just physics with better lighting.',
  },
] as const satisfies readonly TransportHub[]

export type TransportHubSlug = typeof TRANSPORT_HUBS[number]['slug']

export function getTransportHub(slug: string): TransportHub | null {
  return TRANSPORT_HUBS.find(hub => hub.slug === slug) ?? null
}

export function requireTransportHub(slug: TransportHubSlug): TransportHub {
  const hub = getTransportHub(slug)
  if (!hub) throw new Error(`Missing transport hub: ${slug}`)
  return hub
}

function verifiedRegularPrice(pub: Pub): number {
  return pub.priceVerified && pub.regularPrice !== null ? pub.regularPrice : Number.MAX_VALUE
}

export function rankPubsForTransportHub(pubs: Pub[], hub: TransportHub, limit: number = 24): TransportHubPub[] {
  return pubs
    .filter(pub => Number.isFinite(pub.lat) && Number.isFinite(pub.lng) && !(pub.lat === 0 && pub.lng === 0))
    .map(pub => ({
      ...pub,
      distanceKm: haversineDistanceKm(hub.lat, hub.lng, pub.lat, pub.lng),
    }))
    .filter(pub => pub.distanceKm <= hub.radiusKm)
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
      return verifiedRegularPrice(a) - verifiedRegularPrice(b)
    })
    .slice(0, limit)
}
