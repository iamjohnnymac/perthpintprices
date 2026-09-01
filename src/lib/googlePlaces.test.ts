import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getGooglePlaceDetails, mapGooglePlace, searchGooglePlaces } from './googlePlaces'

const googlePlace = {
  id: 'place-123',
  displayName: { text: 'Official Test Pub' },
  formattedAddress: '1 Test Street, Eglinton WA 6034, Australia',
  addressComponents: [
    { longText: 'Eglinton', types: ['locality', 'political'] },
  ],
  location: { latitude: -31.588, longitude: 115.68 },
  primaryType: 'pub',
  types: ['pub', 'bar'],
  businessStatus: 'OPERATIONAL',
  websiteUri: 'https://example.com',
  nationalPhoneNumber: '(08) 9000 0000',
  googleMapsUri: 'https://maps.google.com/?cid=123',
}

describe('Google Places mapping', () => {
  it('maps official place fields and derives the suburb', () => {
    assert.deepEqual(mapGooglePlace(googlePlace), {
      placeId: 'place-123',
      name: 'Official Test Pub',
      address: '1 Test Street, Eglinton WA 6034, Australia',
      suburb: 'Eglinton',
      lat: -31.588,
      lng: 115.68,
      primaryType: 'pub',
      types: ['pub', 'bar'],
      businessStatus: 'OPERATIONAL',
      website: 'https://example.com',
      phone: '(08) 9000 0000',
      googleMapsUri: 'https://maps.google.com/?cid=123',
    })
  })

  it('searches around Perth with a field mask and maps results', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url)
      capturedInit = init
      return new Response(JSON.stringify({ places: [googlePlace] }), { status: 200 })
    }

    const results = await searchGooglePlaces('Official Test Pub Eglinton', 'test-key', fetcher)

    assert.equal(capturedUrl, 'https://places.googleapis.com/v1/places:searchText')
    assert.equal(capturedInit?.method, 'POST')
    assert.match(String(new Headers(capturedInit?.headers).get('X-Goog-FieldMask')), /places\.id/)
    assert.equal(results[0]?.placeId, 'place-123')
    assert.match(String(capturedInit?.body), /"regionCode":"AU"/)
  })

  it('fetches place details by ID before approval', async () => {
    const fetcher = async () => new Response(JSON.stringify(googlePlace), { status: 200 })
    const result = await getGooglePlaceDetails('place-123', 'test-key', fetcher)

    assert.equal(result?.name, 'Official Test Pub')
    assert.equal(result?.suburb, 'Eglinton')
  })
})
