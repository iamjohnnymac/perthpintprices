const PLACES_BASE_URL = 'https://places.googleapis.com/v1'
const PERTH_CENTRE = { latitude: -31.9523, longitude: 115.8613 }

const PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
  'primaryType',
  'types',
  'businessStatus',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'googleMapsUri',
].join(',')

interface GoogleAddressComponent {
  longText?: string
  shortText?: string
  types?: string[]
}

interface GooglePlaceResponse {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  addressComponents?: GoogleAddressComponent[]
  location?: { latitude?: number; longitude?: number }
  primaryType?: string
  types?: string[]
  businessStatus?: string
  websiteUri?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  googleMapsUri?: string
}

export interface GooglePlaceMatch {
  placeId: string
  name: string
  address: string
  suburb: string | null
  lat: number
  lng: number
  primaryType: string | null
  types: string[]
  businessStatus: string | null
  website: string | null
  phone: string | null
  googleMapsUri: string | null
}

export class GooglePlacesConfigurationError extends Error {}

function getApiKey(apiKey?: string): string {
  const value = apiKey || process.env.GOOGLE_PLACES_API_KEY
  if (!value) throw new GooglePlacesConfigurationError('Google Places is not configured.')
  return value
}

function getSuburb(components: GoogleAddressComponent[] = []): string | null {
  const preferredTypes = ['locality', 'postal_town', 'sublocality_level_1']

  for (const type of preferredTypes) {
    const component = components.find((item) => item.types?.includes(type))
    if (component?.longText) return component.longText
  }

  return null
}

export function mapGooglePlace(place: GooglePlaceResponse): GooglePlaceMatch | null {
  const latitude = place.location?.latitude
  const longitude = place.location?.longitude
  const name = place.displayName?.text?.trim()

  if (!place.id || !name || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }

  return {
    placeId: place.id,
    name,
    address: place.formattedAddress || '',
    suburb: getSuburb(place.addressComponents),
    lat: latitude,
    lng: longitude,
    primaryType: place.primaryType || null,
    types: place.types || [],
    businessStatus: place.businessStatus || null,
    website: place.websiteUri || null,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    googleMapsUri: place.googleMapsUri || null,
  }
}

async function placesRequest(
  url: string,
  init: RequestInit,
  apiKey?: string,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetcher(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(apiKey),
      'X-Goog-FieldMask': init.method === 'POST'
        ? PLACE_FIELDS.split(',').map((field) => `places.${field}`).join(',')
        : PLACE_FIELDS,
      ...init.headers,
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`Google Places request failed with status ${response.status}.`)
  }

  return response.json()
}

export async function searchGooglePlaces(
  query: string,
  apiKey?: string,
  fetcher: typeof fetch = fetch,
): Promise<GooglePlaceMatch[]> {
  const body = await placesRequest(
    `${PLACES_BASE_URL}/places:searchText`,
    {
      method: 'POST',
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 5,
        languageCode: 'en',
        regionCode: 'AU',
        locationBias: {
          circle: { center: PERTH_CENTRE, radius: 50000 },
        },
      }),
    },
    apiKey,
    fetcher,
  ) as { places?: GooglePlaceResponse[] }

  return (body.places || [])
    .map(mapGooglePlace)
    .filter((place): place is GooglePlaceMatch => place !== null)
}

export async function getGooglePlaceDetails(
  placeId: string,
  apiKey?: string,
  fetcher: typeof fetch = fetch,
): Promise<GooglePlaceMatch | null> {
  const body = await placesRequest(
    `${PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`,
    { method: 'GET' },
    apiKey,
    fetcher,
  ) as GooglePlaceResponse

  return mapGooglePlace(body)
}
