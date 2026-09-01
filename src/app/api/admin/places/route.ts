import { NextRequest, NextResponse } from 'next/server'

import { authenticateAdminRequest } from '@/lib/adminAuth'
import { GooglePlacesConfigurationError, searchGooglePlaces } from '@/lib/googlePlaces'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request)
  if (!auth.authenticated) return auth.response

  const query = request.nextUrl.searchParams.get('q')?.trim() || ''
  if (query.length < 3) {
    return NextResponse.json({ error: 'Enter at least three characters.' }, { status: 400 })
  }

  try {
    const places = await searchGooglePlaces(query)
    return NextResponse.json({ places })
  } catch (error) {
    if (error instanceof GooglePlacesConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    console.error('Google Places search failed:', error)
    return NextResponse.json({ error: 'Google Places search failed.' }, { status: 502 })
  }
}
