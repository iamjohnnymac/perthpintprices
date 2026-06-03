import type { Pub } from '@/types/pub'
import { haversineDistanceKm } from '@/lib/location'

export type StudentCampus = {
  slug: string
  name: string
  shortName: string
  lat: number
  lng: number
  radiusKm: number
  note: string
}

export type StudentPintPub = Pub & {
  campusSlug: string
  campusName: string
  campusShortName: string
  distanceKm: number
}

export const STUDENT_CAMPUSES = [
  {
    slug: 'uwa',
    name: 'University of Western Australia',
    shortName: 'UWA',
    lat: -31.9805,
    lng: 115.8197,
    radiusKm: 4,
    note: 'Crawley and Subiaco do most of the useful work here. Close is nice, but checked price still wins.',
  },
  {
    slug: 'curtin',
    name: 'Curtin University',
    shortName: 'Curtin',
    lat: -32.0063,
    lng: 115.8949,
    radiusKm: 4,
    note: 'Bentley, Vic Park, East Vic Park and Como give Curtin the strongest nearby cheap-pint cluster.',
  },
  {
    slug: 'murdoch',
    name: 'Murdoch University',
    shortName: 'Murdoch',
    lat: -32.0662,
    lng: 115.8358,
    radiusKm: 8,
    note: 'Murdoch needs a wider net in the current verified data. Treat these as nearby-ish options, not a between-lectures sprint.',
  },
] as const satisfies readonly StudentCampus[]

export function rankStudentPintsForCampus(pubs: Pub[], campus: StudentCampus, limit: number = 8): StudentPintPub[] {
  return pubs
    .filter(pub => pub.priceVerified && pub.regularPrice !== null && pub.regularPrice < 10)
    .filter(pub => Number.isFinite(pub.lat) && Number.isFinite(pub.lng) && !(pub.lat === 0 && pub.lng === 0))
    .map(pub => ({
      ...pub,
      campusSlug: campus.slug,
      campusName: campus.name,
      campusShortName: campus.shortName,
      distanceKm: haversineDistanceKm(campus.lat, campus.lng, pub.lat, pub.lng),
    }))
    .filter(pub => pub.distanceKm <= campus.radiusKm)
    .sort((a, b) => {
      if (a.regularPrice !== b.regularPrice) return (a.regularPrice ?? Number.MAX_VALUE) - (b.regularPrice ?? Number.MAX_VALUE)
      return a.distanceKm - b.distanceKm
    })
    .slice(0, limit)
}

export function rankStudentPints(pubs: Pub[]): StudentPintPub[] {
  return STUDENT_CAMPUSES
    .flatMap(campus => rankStudentPintsForCampus(pubs, campus, Number.MAX_SAFE_INTEGER))
    .sort((a, b) => {
      if (a.regularPrice !== b.regularPrice) return (a.regularPrice ?? Number.MAX_VALUE) - (b.regularPrice ?? Number.MAX_VALUE)
      return a.distanceKm - b.distanceKm
    })
}
