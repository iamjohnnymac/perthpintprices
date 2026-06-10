import assert from 'node:assert/strict'
import test from 'node:test'
import type { Pub } from '@/types/pub'
import { resizeGooglePhoto, slimPubForFeature, slimPubForList } from './pubPhoto'

const LH3 = 'https://lh3.googleusercontent.com/place-photos/AJRVUZabc_123'

test('resizeGooglePhoto swaps an existing size token for the requested width', () => {
  assert.equal(resizeGooglePhoto(`${LH3}=s4800-w1024`), `${LH3}=w640`)
  assert.equal(resizeGooglePhoto(`${LH3}=s4800-w1024`, 800), `${LH3}=w800`)
  // Idempotent — re-resizing an already-resized URL is a no-op.
  assert.equal(resizeGooglePhoto(`${LH3}=w640`), `${LH3}=w640`)
})

test('resizeGooglePhoto appends a size token when none is present', () => {
  assert.equal(resizeGooglePhoto(LH3), `${LH3}=w640`)
})

test('resizeGooglePhoto leaves non-Google, query-string and empty values untouched', () => {
  assert.equal(resizeGooglePhoto('https://cdn.example.com/pub.jpg'), 'https://cdn.example.com/pub.jpg')
  // A Google URL carrying a query string is left alone (stored Place photos never have one).
  assert.equal(
    resizeGooglePhoto('https://lh3.googleusercontent.com/place-photos/ABC?sz=100'),
    'https://lh3.googleusercontent.com/place-photos/ABC?sz=100',
  )
  assert.equal(resizeGooglePhoto(null), null)
  assert.equal(resizeGooglePhoto(undefined), undefined)
  assert.equal(resizeGooglePhoto(''), '')
})

test('slimPubForList drops heavy Google enrichment but keeps list fields', () => {
  const pub = {
    id: 7,
    name: 'The Test Hotel',
    slug: 'the-test-hotel',
    suburb: 'Fremantle',
    address: '1 Test St',
    price: 12,
    beerType: 'Lager',
    happyHour: '4-6pm',
    vibeTag: 'cosy',
    googlePhotoUrl: `${LH3}=s4800-w1024`,
    googlePhotoAttribution: 'A. Contributor',
    googlePhotoAttributionUri: 'https://maps.google.com/contrib/123',
    googleEditorialSummary: 'A long editorial summary that bloats the payload.',
    googleOpeningHours: { weekdayDescriptions: ['Mon: 9-5'], periods: [] },
    googleRating: 4.5,
    googleRatingCount: 321,
    outdoorSeating: true,
    businessStatus: 'OPERATIONAL',
  } as unknown as Pub

  const trimmed = slimPubForList(pub)

  // Heavy, list-irrelevant enrichment is gone.
  for (const dropped of [
    'googlePhotoUrl', 'googlePhotoAttribution', 'googlePhotoAttributionUri',
    'googleEditorialSummary', 'googleOpeningHours', 'googleRating',
    'googleRatingCount', 'outdoorSeating', 'businessStatus',
  ]) {
    assert.equal(dropped in trimmed, false, `${dropped} should be dropped`)
  }
  // Fields the list/card UI actually renders are kept.
  assert.equal(trimmed.name, 'The Test Hotel')
  assert.equal(trimmed.suburb, 'Fremantle')
  assert.equal(trimmed.address, '1 Test St')
  assert.equal(trimmed.price, 12)
  assert.equal(trimmed.beerType, 'Lager')
  assert.equal(trimmed.happyHour, '4-6pm')
  assert.equal(trimmed.vibeTag, 'cosy')
})

test('slimPubForFeature keeps the amenity flags the pub-pick filters read', () => {
  const pub = {
    id: 8,
    name: 'The Pick Test',
    slug: 'the-pick-test',
    suburb: 'Morley',
    price: 9,
    goodForChildren: true,
    outdoorSeating: true,
    goodForWatchingSports: false,
    googlePhotoUrl: `${LH3}=s4800-w1024`,
    googleEditorialSummary: 'Still heavy, still dropped.',
    googleRating: 4.1,
    businessStatus: 'OPERATIONAL',
  } as unknown as Pub

  const trimmed = slimPubForFeature(pub)

  // The isDadBar inputs survive.
  assert.equal(trimmed.goodForChildren, true)
  assert.equal(trimmed.outdoorSeating, true)
  assert.equal(trimmed.goodForWatchingSports, false)
  // The heavy enrichment still goes.
  for (const dropped of ['googlePhotoUrl', 'googleEditorialSummary', 'googleRating', 'businessStatus']) {
    assert.equal(dropped in trimmed, false, `${dropped} should be dropped`)
  }
})
