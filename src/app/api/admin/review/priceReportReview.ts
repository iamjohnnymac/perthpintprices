import { priceReportConfidence, priceReportSource, reportSubmissionSource } from '@/lib/priceProvenance'
import { toSuburbSlug } from '@/lib/urls'

interface ReviewPriceReportArgs {
  id: string | number
  action: string
  target_slug?: string
}

export async function reviewPriceReport(
  supabase: any,
  { id, action, target_slug }: ReviewPriceReportArgs,
  nowDate = new Date(),
) {
  const now = nowDate.toISOString()

  if (action === 'reject') {
    const { error: rejectErr } = await supabase
      .from('price_reports')
      .update({ status: 'rejected', verified_at: now, verified_by: 'admin' })
      .eq('id', id)

    if (rejectErr) {
      return { status: 500, body: { error: 'Failed to reject report: ' + rejectErr.message } }
    }

    return { status: 200, body: { success: true, action: 'rejected' } }
  }

  if (action !== 'approve') {
    return { status: 400, body: { error: 'Invalid action' } }
  }

  const { data: report, error: reportErr } = await supabase
    .from('price_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (reportErr || !report) {
    return { status: 404, body: { error: 'Report not found' } }
  }

  const submissionSource = reportSubmissionSource(
    report.submission_source,
    report.notes,
    report.report_type,
  )

  if (submissionSource === 'aggregator_lead') {
    return {
      status: 409,
      body: { error: 'Aggregator leads need independent evidence before approval.' },
    }
  }

  if (report.report_type === 'outdated_flag' || submissionSource === 'stale_flag') {
    const { error: reviewErr } = await supabase
      .from('price_reports')
      .update({ status: 'reviewed', verified_at: now, verified_by: 'admin' })
      .eq('id', id)

    // Surface a failed write (for example a status constraint that does not
    // allow 'reviewed') instead of telling the admin the flag was handled.
    if (reviewErr) {
      return { status: 500, body: { error: 'Failed to mark flag reviewed: ' + reviewErr.message } }
    }

    return { status: 200, body: { success: true, action: 'reviewed', pubSlug: target_slug || report.pub_slug } }
  }

  const slug = target_slug || report.pub_slug
  const priceSource = priceReportSource(report)
  const priceConfidence = priceReportConfidence(report)
  const isHappyHour = report.report_type === 'happy_hour_report'
  const updatePayload: Record<string, unknown> = {
    last_updated: now,
  }

  if (isHappyHour) {
    updatePayload.happy_hour_price = report.reported_price
  } else {
    updatePayload.price = report.reported_price
    updatePayload.price_verified = true
    updatePayload.last_verified = now
    updatePayload.price_verified_at = now
    updatePayload.price_source = priceSource
    updatePayload.price_confidence = priceConfidence
    if (report.beer_type) {
      updatePayload.beer_type = report.beer_type
    }
  }

  const { data: updatedPubs, error: pubErr } = await supabase
    .from('pubs')
    .update(updatePayload)
    .eq('slug', slug)
    .select('slug, suburb')

  if (pubErr) {
    return { status: 500, body: { error: 'Failed to update pub: ' + pubErr.message } }
  }

  if (!updatedPubs || updatedPubs.length === 0) {
    return { status: 404, body: { error: `No pub found with slug "${slug}"` } }
  }

  // The pub row is written from here on. Later failures must still report the
  // slug so the route expires the caches for the price that did change.
  const suburb = updatedPubs[0]?.suburb
  const suburbSlug = typeof suburb === 'string' && suburb.trim() ? toSuburbSlug(suburb) : null
  const followUpErrors: string[] = []

  if (!isHappyHour) {
    const { data: pub, error: pubIdErr } = await supabase
      .from('pubs')
      .select('id')
      .eq('slug', slug)
      .single()

    if (pubIdErr || !pub) {
      followUpErrors.push('price history was not recorded')
    } else {
      const { error: historyErr } = await supabase.from('price_history').insert({
        pub_id: pub.id,
        price: report.reported_price,
        change_type: 'update',
        source: priceSource,
        changed_at: now,
        verified_at: now,
        confidence: priceConfidence,
      })
      if (historyErr) followUpErrors.push('price history was not recorded: ' + historyErr.message)
    }
  }

  const { error: verifyErr } = await supabase
    .from('price_reports')
    .update({ status: 'verified', verified_at: now, verified_by: 'admin' })
    .eq('id', id)
  if (verifyErr) followUpErrors.push('the report is still pending: ' + verifyErr.message)

  if (followUpErrors.length > 0) {
    return {
      status: 500,
      body: {
        error: `The pub price was updated, but ${followUpErrors.join('; ')}. Do not approve this report again.`,
        pubUpdated: true,
        pubSlug: slug,
        suburbSlug,
      },
    }
  }

  return { status: 200, body: { success: true, action: 'approved', pubSlug: slug, suburbSlug } }
}
