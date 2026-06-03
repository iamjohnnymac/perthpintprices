import assert from 'node:assert/strict'
import test from 'node:test'
import { rankStudentPints, rankStudentPintsForCampus, STUDENT_CAMPUSES } from './studentPints'
import type { Pub } from '@/types/pub'

function pub(overrides: Partial<Pub>): Pub {
  return {
    id: 1,
    slug: 'test-pub',
    name: 'Test Pub',
    address: '',
    suburb: 'Perth',
    lat: -31.9805,
    lng: 115.8197,
    price: null,
    beerType: '',
    happyHour: null,
    website: null,
    description: null,
    priceSource: null,
    priceVerifiedAt: null,
    priceConfidence: null,
    priceVerified: true,
    hasTab: false,
    kidFriendly: false,
    happyHourPrice: null,
    happyHourDays: null,
    happyHourStart: null,
    happyHourEnd: null,
    lastVerified: null,
    regularPrice: 8,
    isHappyHourNow: false,
    happyHourLabel: null,
    happyHourMinutesRemaining: null,
    imageUrl: null,
    vibeTag: null,
    cozyPub: false,
    effectivePrice: null,
    ...overrides,
  }
}

test('rankStudentPintsForCampus keeps only verified sub-$10 rows inside the campus radius', () => {
  const campus = STUDENT_CAMPUSES[0]
  const rows = rankStudentPintsForCampus([
    pub({ id: 1, name: 'Good Row', regularPrice: 8, lat: campus.lat, lng: campus.lng }),
    pub({ id: 2, name: 'Ten Dollar Row', regularPrice: 10, lat: campus.lat, lng: campus.lng }),
    pub({ id: 3, name: 'Unverified Row', regularPrice: 7, priceVerified: false, lat: campus.lat, lng: campus.lng }),
    pub({ id: 4, name: 'Far Row', regularPrice: 7, lat: campus.lat + 0.2, lng: campus.lng }),
  ], campus)

  assert.deepEqual(rows.map(row => row.name), ['Good Row'])
})

test('rankStudentPintsForCampus sorts by price before direct distance', () => {
  const campus = STUDENT_CAMPUSES[0]
  const rows = rankStudentPintsForCampus([
    pub({ id: 1, name: 'Closer Nine', regularPrice: 9, lat: campus.lat, lng: campus.lng }),
    pub({ id: 2, name: 'Further Seven', regularPrice: 7, lat: campus.lat + 0.01, lng: campus.lng }),
  ], campus)

  assert.deepEqual(rows.map(row => row.name), ['Further Seven', 'Closer Nine'])
})

test('rankStudentPints sorts combined campus rows by cheapest price', () => {
  const [uwa, curtin] = STUDENT_CAMPUSES
  const rows = rankStudentPints([
    pub({ id: 1, name: 'UWA Eight', regularPrice: 8, lat: uwa.lat, lng: uwa.lng }),
    pub({ id: 2, name: 'Curtin Seven', regularPrice: 7, lat: curtin.lat, lng: curtin.lng }),
  ])

  assert.deepEqual(rows.map(row => row.name), ['Curtin Seven', 'UWA Eight'])
})
