import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { reviewPriceReport } from './priceReportReview'
import { reviewPubSubmission } from './pubSubmissionReview'
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
  const { type, id, action, target_slug, place_id } = body

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
      const result = await reviewPubSubmission(supabase, { id, action, place_id })

      if (result.status === 200 && result.body.action === 'approved' && result.body.slug && result.body.suburbSlug) {
        revalidateTag(PUBS_CACHE_TAG, 'max')
        revalidateTag(`pub:${result.body.slug}`, 'max')
        revalidatePath(`/${result.body.suburbSlug}/${result.body.slug}`)
        revalidatePath(`/${result.body.suburbSlug}`)
        revalidatePath('/sitemap-pubs.xml')
        revalidatePath('/sitemap.xml')
      }

      return NextResponse.json(result.body, { status: result.status })
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
