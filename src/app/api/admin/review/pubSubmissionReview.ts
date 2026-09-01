import { getGooglePlaceDetails, type GooglePlaceMatch } from '@/lib/googlePlaces'
import { toSuburbSlug } from '@/lib/urls'

interface ReviewPubSubmissionArgs {
  id: string | number
  action: string
  place_id?: string
}

type PlaceDetailsLookup = (placeId: string) => Promise<GooglePlaceMatch | null>

export async function reviewPubSubmission(
  supabase: any,
  { id, action, place_id }: ReviewPubSubmissionArgs,
  nowDate = new Date(),
  getPlaceDetails: PlaceDetailsLookup = getGooglePlaceDetails,
) {
  const now = nowDate.toISOString()

  if (action === 'reject') {
    const { error } = await supabase
      .from('pub_submissions')
      .update({ status: 'rejected', reviewed_at: now })
      .eq('id', id)

    if (error) {
      return { status: 500, body: { error: 'Failed to reject submission: ' + error.message } }
    }

    return { status: 200, body: { success: true, action: 'rejected' } }
  }

  if (action !== 'approve') {
    return { status: 400, body: { error: 'Invalid action' } }
  }

  if (!place_id) {
    return { status: 400, body: { error: 'Choose the official Google listing before approval.' } }
  }

  const { data: submission, error: submissionError } = await supabase
    .from('pub_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (submissionError || !submission) {
    return { status: 404, body: { error: 'Submission not found' } }
  }

  const place = await getPlaceDetails(place_id)
  if (!place) {
    return { status: 404, body: { error: 'Google listing not found.' } }
  }

  if (place.businessStatus === 'CLOSED_PERMANENTLY') {
    return { status: 409, body: { error: 'This Google listing is permanently closed.' } }
  }

  const { data: existingPlace } = await supabase
    .from('pubs')
    .select('slug')
    .eq('place_id', place.placeId)
    .maybeSingle()

  if (existingPlace) {
    return {
      status: 409,
      body: { error: 'That Google listing already belongs to an existing pub.' },
    }
  }

  const slug = toSuburbSlug(place.name)
  const suburb = place.suburb || submission.suburb
  const { data: existingSlug } = await supabase
    .from('pubs')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle()

  if (existingSlug) {
    return { status: 409, body: { error: 'A pub with this page name already exists.' } }
  }

  const { error: createError } = await supabase
    .from('pubs')
    .insert({
      slug,
      name: place.name,
      suburb,
      address: place.address || submission.address || null,
      lat: place.lat,
      lng: place.lng,
      website: place.website,
      phone: place.phone,
      place_id: place.placeId,
      price: submission.price || null,
      beer_type: submission.beer_type || null,
      price_verified: Boolean(submission.price),
      last_verified: submission.price ? now : null,
      price_verified_at: submission.price ? now : null,
      price_source: submission.price ? 'crowdsourced' : null,
      price_confidence: submission.price ? 'medium' : null,
      last_updated: now,
    })

  if (createError) {
    return { status: 500, body: { error: 'Failed to create pub: ' + createError.message } }
  }

  const { error: reviewError } = await supabase
    .from('pub_submissions')
    .update({ status: 'approved', reviewed_at: now })
    .eq('id', id)

  if (reviewError) {
    return { status: 500, body: { error: 'Pub created, but the submission could not be marked approved.' } }
  }

  return {
    status: 200,
    body: {
      success: true,
      action: 'approved',
      slug,
      suburb,
      suburbSlug: toSuburbSlug(suburb),
    },
  }
}
