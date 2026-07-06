import assert from 'node:assert/strict'
import test from 'node:test'
import { Pub } from '@/types/pub'
import { buildPubJsonLd } from './pubJsonLd'

function makePub(overrides: Partial<Pub> = {}): Pub {
  return {
    id: 1,
    slug: 'the-test-pub',
    name: 'The Test Pub',
    address: '1 Test Street',
    suburb: 'Fremantle',
    lat: -32.0569,
    lng: 115.7439,
    price: 10,
    regularPrice: 10,
    effectivePrice: 10,
    beerType: 'Lager',
    happyHour: null,
    website: 'https://example.com',
    description: null,
    priceSource: null,
    priceVerifiedAt: null,
    priceConfidence: null,
    priceVerified: true,
    hasTab: false,
    kidFriendly: false,
    cozyPub: false,
    happyHourPrice: null,
    happyHourDays: null,
    happyHourStart: null,
    happyHourEnd: null,
    lastVerified: '2026-05-30T08:00:00+08:00',
    isHappyHourNow: false,
    happyHourLabel: null,
    happyHourMinutesRemaining: null,
    imageUrl: null,
    vibeTag: null,
    ...overrides,
  }
}

test('builds one connected pub page @graph with stable IDs', () => {
  const jsonLd = buildPubJsonLd(makePub(), 9.5)
  const graph = jsonLd['@graph'] as Record<string, unknown>[]
  const [webPage, barOrPub, breadcrumb] = graph

  assert.equal(jsonLd['@context'], 'https://schema.org')
  assert.equal(graph.length, 3)
  assert.equal(webPage['@id'], 'https://perthpintprices.com/fremantle/the-test-pub#webpage')
  assert.deepEqual(webPage.mainEntity, { '@id': 'https://perthpintprices.com/fremantle/the-test-pub#pub' })
  assert.deepEqual(webPage.breadcrumb, { '@id': 'https://perthpintprices.com/fremantle/the-test-pub#breadcrumb' })
  assert.equal(webPage.dateModified, '2026-05-30T00:00:00.000Z')
  assert.equal(barOrPub['@id'], 'https://perthpintprices.com/fremantle/the-test-pub#pub')
  assert.equal(breadcrumb['@id'], 'https://perthpintprices.com/fremantle/the-test-pub#breadcrumb')
})

test('emits schema-valid priceRange bands, not pint-price sentences', () => {
  const cheap = buildPubJsonLd(makePub({ regularPrice: 7, price: 7 }), 10)
  const fair = buildPubJsonLd(makePub({ regularPrice: 10, price: 10 }), 10)
  const pricey = buildPubJsonLd(makePub({ regularPrice: 13, price: 13 }), 10)

  assert.equal(((cheap['@graph'] as Record<string, unknown>[])[1]).priceRange, '$')
  assert.equal(((fair['@graph'] as Record<string, unknown>[])[1]).priceRange, '$$')
  assert.equal(((pricey['@graph'] as Record<string, unknown>[])[1]).priceRange, '$$$')
  assert.doesNotMatch(JSON.stringify(fair), /per pint/)
})

test('omits priceRange and dateModified when source data is missing', () => {
  const jsonLd = buildPubJsonLd(makePub({ regularPrice: null, price: null, lastVerified: null }), 10)
  const [webPage, barOrPub] = jsonLd['@graph'] as Record<string, unknown>[]

  assert.equal(webPage.dateModified, undefined)
  assert.equal(barOrPub.priceRange, undefined)
})

test('adds happy-hour openingHoursSpecification only for structured happy hour windows', () => {
  const jsonLd = buildPubJsonLd(makePub({
    happyHourPrice: 8,
    happyHourDays: '{Mon,Tue,Wed,Thu,Fri}',
    happyHourStart: '17:00:00',
    happyHourEnd: '18:30:00',
  }), 10)
  const barOrPub = (jsonLd['@graph'] as Record<string, unknown>[])[1]
  const specs = barOrPub.openingHoursSpecification as Record<string, unknown>[]
  const openingHours = specs[0]

  assert.equal(specs.length, 1)
  assert.equal(openingHours['@type'], 'OpeningHoursSpecification')
  assert.deepEqual(openingHours.dayOfWeek, [
    'https://schema.org/Monday',
    'https://schema.org/Tuesday',
    'https://schema.org/Wednesday',
    'https://schema.org/Thursday',
    'https://schema.org/Friday',
  ])
  assert.equal(openingHours.opens, '17:00:00')
  assert.equal(openingHours.closes, '18:30:00')
})

test('builds regular openingHoursSpecification from Google periods (day 0 = Sunday)', () => {
  const jsonLd = buildPubJsonLd(makePub({
    googleOpeningHours: {
      periods: [
        { open: { day: 5, hour: 16, minute: 0 }, close: { day: 5, hour: 23, minute: 30 } },
        { open: { day: 0, hour: 12, minute: 0 }, close: { day: 0, hour: 22, minute: 0 } },
      ],
    },
  }), 10)
  const barOrPub = (jsonLd['@graph'] as Record<string, unknown>[])[1]
  const specs = barOrPub.openingHoursSpecification as Record<string, unknown>[]

  assert.equal(specs.length, 2)
  assert.equal(specs[0].dayOfWeek, 'https://schema.org/Friday')
  assert.equal(specs[0].opens, '16:00:00')
  assert.equal(specs[0].closes, '23:30:00')
  assert.equal(specs[1].dayOfWeek, 'https://schema.org/Sunday')
})

test('emits amenityFeature only for Google-affirmed (true) attributes', () => {
  const jsonLd = buildPubJsonLd(makePub({
    outdoorSeating: true,
    allowsDogs: true,
    liveMusic: false,
    goodForChildren: null,
  }), 10)
  const barOrPub = (jsonLd['@graph'] as Record<string, unknown>[])[1]
  const features = barOrPub.amenityFeature as Array<{ '@type': string; name: string; value: boolean }>

  const names = features.map(f => f.name)
  assert.deepEqual(names, ['Outdoor seating', 'Dog friendly'])
  assert.ok(features.every(f => f.value === true))
  assert.ok(features.every(f => f['@type'] === 'LocationFeatureSpecification'))
})

test('omits amenityFeature entirely when no attribute is true', () => {
  const barOrPub = (buildPubJsonLd(makePub(), 10)['@graph'] as Record<string, unknown>[])[1]
  assert.equal(barOrPub.amenityFeature, undefined)
})

test('omits geo and hasMap when either coordinate is missing', () => {
  const missingLat = buildPubJsonLd(makePub({ lat: 0, lng: 115.7439 }), 10)
  const missingLng = buildPubJsonLd(makePub({ lat: -32.0569, lng: 0 }), 10)

  for (const jsonLd of [missingLat, missingLng]) {
    const barOrPub = (jsonLd['@graph'] as Record<string, unknown>[])[1]
    assert.equal(barOrPub.geo, undefined)
    assert.equal(barOrPub.hasMap, undefined)
  }
})

test('omits happy-hour openingHoursSpecification for invalid time values', () => {
  const jsonLd = buildPubJsonLd(makePub({
    happyHourPrice: 8,
    happyHourDays: 'Friday',
    happyHourStart: '99:00:00',
    happyHourEnd: '18:00:00',
  }), 10)
  const barOrPub = (jsonLd['@graph'] as Record<string, unknown>[])[1]

  assert.equal(barOrPub.openingHoursSpecification, undefined)
})

test('reconciles the pub to its Google listing via sameAs + hasMap when place_id is set', () => {
  const jsonLd = buildPubJsonLd(makePub({ placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' }), 10)
  const barOrPub = (jsonLd['@graph'] as Record<string, unknown>[])[1]

  const placeUrl = 'https://www.google.com/maps/place/?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4'
  assert.deepEqual(barOrPub.sameAs, [placeUrl])
  assert.equal(barOrPub.hasMap, placeUrl)
})

test('falls back to a lat/lng map search and omits sameAs when there is no place_id', () => {
  const barOrPub = (buildPubJsonLd(makePub(), 10)['@graph'] as Record<string, unknown>[])[1]

  assert.equal(barOrPub.hasMap, 'https://www.google.com/maps/search/?api=1&query=-32.0569,115.7439')
  assert.equal(barOrPub.sameAs, undefined)
})

test('emits telephone only when a phone number is present', () => {
  const withPhone = buildPubJsonLd(makePub({ phone: '+61 8 9335 1234' }), 10)
  const withoutPhone = buildPubJsonLd(makePub(), 10)

  assert.equal(((withPhone['@graph'] as Record<string, unknown>[])[1]).telephone, '+61 8 9335 1234')
  assert.equal(((withoutPhone['@graph'] as Record<string, unknown>[])[1]).telephone, undefined)
})
