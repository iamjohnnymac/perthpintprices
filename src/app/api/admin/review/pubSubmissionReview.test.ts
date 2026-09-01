import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { GooglePlaceMatch } from '@/lib/googlePlaces'
import { reviewPubSubmission } from './pubSubmissionReview'

const now = new Date('2026-09-01T05:00:00.000Z')
const officialPlace: GooglePlaceMatch = {
  placeId: 'ChIJ-official',
  name: 'Amberton Beach Bar and Kitchen',
  address: '100 Ocean Drive, Eglinton WA 6034, Australia',
  suburb: 'Eglinton',
  lat: -31.5901,
  lng: 115.6599,
  primaryType: 'restaurant',
  types: ['restaurant', 'bar'],
  businessStatus: 'OPERATIONAL',
  website: 'https://example.com/amberton',
  phone: '(08) 9000 0000',
  googleMapsUri: 'https://maps.google.com/?cid=123',
}

describe('admin pub submission review', () => {
  it('requires an official Google listing before approval', async () => {
    const supabase = reviewSupabase()
    const result = await reviewPubSubmission(supabase, { id: 1, action: 'approve' }, now)

    assert.equal(result.status, 400)
    assert.match(String(result.body.error), /official Google listing/)
    assert.equal(supabase.calls.pubInsert, null)
  })

  it('creates the pub from server-fetched official place details', async () => {
    const supabase = reviewSupabase()
    const result = await reviewPubSubmission(
      supabase,
      { id: 1, action: 'approve', place_id: officialPlace.placeId },
      now,
      async () => officialPlace,
    )

    assert.equal(result.status, 200)
    assert.deepEqual(supabase.calls.pubInsert, {
      slug: 'amberton-beach-bar-and-kitchen',
      name: 'Amberton Beach Bar and Kitchen',
      suburb: 'Eglinton',
      address: '100 Ocean Drive, Eglinton WA 6034, Australia',
      lat: -31.5901,
      lng: 115.6599,
      website: 'https://example.com/amberton',
      phone: '(08) 9000 0000',
      place_id: 'ChIJ-official',
      price: 15,
      beer_type: 'Single Fin',
      price_verified: true,
      last_verified: '2026-09-01T05:00:00.000Z',
      price_verified_at: '2026-09-01T05:00:00.000Z',
      price_source: 'crowdsourced',
      price_confidence: 'medium',
      last_updated: '2026-09-01T05:00:00.000Z',
    })
    assert.deepEqual(supabase.calls.submissionUpdate, {
      status: 'approved',
      reviewed_at: '2026-09-01T05:00:00.000Z',
    })
    assert.equal(result.body.slug, 'amberton-beach-bar-and-kitchen')
    assert.equal(result.body.suburbSlug, 'eglinton')
  })

  it('blocks a Google listing already assigned to another pub', async () => {
    const supabase = reviewSupabase({ existingPlaceSlug: 'existing-pub' })
    const result = await reviewPubSubmission(
      supabase,
      { id: 1, action: 'approve', place_id: officialPlace.placeId },
      now,
      async () => officialPlace,
    )

    assert.equal(result.status, 409)
    assert.match(String(result.body.error), /already belongs/)
    assert.equal(supabase.calls.pubInsert, null)
  })

  it('rejects without calling Google Places', async () => {
    const supabase = reviewSupabase()
    let placeLookupCalled = false
    const result = await reviewPubSubmission(
      supabase,
      { id: 1, action: 'reject' },
      now,
      async () => {
        placeLookupCalled = true
        return officialPlace
      },
    )

    assert.equal(result.status, 200)
    assert.equal(placeLookupCalled, false)
    assert.deepEqual(supabase.calls.submissionUpdate, {
      status: 'rejected',
      reviewed_at: '2026-09-01T05:00:00.000Z',
    })
  })
})

function reviewSupabase({ existingPlaceSlug = null, existingSlug = null }: {
  existingPlaceSlug?: string | null
  existingSlug?: string | null
} = {}) {
  const calls: {
    pubInsert: Record<string, unknown> | null
    submissionUpdate: Record<string, unknown> | null
  } = {
    pubInsert: null,
    submissionUpdate: null,
  }

  const submission = {
    id: 1,
    pub_name: 'Amberton bar and restaurant',
    suburb: 'Eglinton',
    address: null,
    price: 15,
    beer_type: 'Single Fin',
  }

  return {
    calls,
    from(table: string) {
      if (table === 'pub_submissions') {
        return {
          select() {
            return {
              eq() {
                return {
                  single() {
                    return Promise.resolve({ data: submission, error: null })
                  },
                }
              },
            }
          },
          update(updates: Record<string, unknown>) {
            calls.submissionUpdate = updates
            return {
              eq() {
                return Promise.resolve({ error: null })
              },
            }
          },
        }
      }

      if (table === 'pubs') {
        return {
          select() {
            return {
              eq(column: string) {
                return {
                  maybeSingle() {
                    const slug = column === 'place_id' ? existingPlaceSlug : existingSlug
                    return Promise.resolve({ data: slug ? { slug } : null, error: null })
                  },
                }
              },
            }
          },
          insert(row: Record<string, unknown>) {
            calls.pubInsert = row
            return Promise.resolve({ error: null })
          },
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  }
}
