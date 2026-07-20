import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { reviewPriceReport } from './priceReportReview'
import { PUBS_CACHE_TAG } from '@/lib/cachedPubs'
import { authenticateAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

interface AdminReviewDeps {
  getServiceClient?: () => SupabaseClient
}

export async function handleAdminReview(request: NextRequest, deps: AdminReviewDeps = {}) {
  const auth = await authenticateAdminRequest(request, deps)
  if (!auth.authenticated) return auth.response
  const supabase = auth.supabase

  const body = await request.json()
  const { type, id, action, target_slug } = body

  if (!type || !id || !action) {
    return NextResponse.json({ error: 'Missing type, id, or action' }, { status: 400 })
  }

  try {
    if (type === 'price_report') {
      const result = await reviewPriceReport(supabase, { id, action, target_slug })
      if (result.status === 200 && result.body.action === 'approved') {
        // Approved prices update the pubs table — expire the shared hourly
        // cache so list pages pick the change up on their next render.
        revalidateTag(PUBS_CACHE_TAG, 'max')
      }
      return NextResponse.json(result.body, { status: result.status })

    } else if (type === 'pub_submission') {
      if (action === 'approve') {
        const { data: sub, error: subErr } = await supabase
          .from('pub_submissions')
          .select('*')
          .eq('id', id)
          .single()

        if (subErr || !sub) {
          return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        const slug = sub.pub_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        const { data: existing } = await supabase
          .from('pubs')
          .select('slug')
          .eq('slug', slug)
          .single()

        if (existing) {
          return NextResponse.json({ error: 'A pub with this name already exists' }, { status: 409 })
        }

        const now = new Date().toISOString()

        const { error: createErr } = await supabase
          .from('pubs')
          .insert({
            slug,
            name: sub.pub_name,
            suburb: sub.suburb,
            address: sub.address || null,
            price: sub.price || null,
            beer_type: sub.beer_type || null,
            price_verified: sub.price ? true : false,
            last_verified: sub.price ? now : null,
            price_verified_at: sub.price ? now : null,
            price_source: sub.price ? 'crowdsourced' : null,
            price_confidence: sub.price ? 'medium' : null,
            last_updated: now,
          })

        if (createErr) {
          return NextResponse.json({ error: 'Failed to create pub: ' + createErr.message }, { status: 500 })
        }

        await supabase
          .from('pub_submissions')
          .update({ status: 'approved', reviewed_at: now })
          .eq('id', id)

        revalidateTag(PUBS_CACHE_TAG, 'max')
        return NextResponse.json({ success: true, action: 'approved', slug })

      } else if (action === 'reject') {
        await supabase
          .from('pub_submissions')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('id', id)

        return NextResponse.json({ success: true, action: 'rejected' })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return handleAdminReview(request)
}
