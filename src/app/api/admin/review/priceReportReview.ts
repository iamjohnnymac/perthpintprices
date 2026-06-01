import { priceReportConfidence, priceReportSource, reportSubmissionSource } from '@/lib/priceProvenance'

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
    await supabase
      .from('price_reports')
      .update({ status: 'rejected', verified_at: now, verified_by: 'admin' })
      .eq('id', id)

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
    await supabase
      .from('price_reports')
      .update({ status: 'reviewed', verified_at: now, verified_by: 'admin' })
      .eq('id', id)

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
    .select('slug')

  if (pubErr) {
    return { status: 500, body: { error: 'Failed to update pub: ' + pubErr.message } }
  }

  if (!updatedPubs || updatedPubs.length === 0) {
    return { status: 404, body: { error: `No pub found with slug "${slug}"` } }
  }

  if (!isHappyHour) {
    const { data: pub } = await supabase
      .from('pubs')
      .select('id')
      .eq('slug', slug)
      .single()

    if (pub) {
      await supabase.from('price_history').insert({
        pub_id: pub.id,
        price: report.reported_price,
        change_type: 'update',
        source: priceSource,
        changed_at: now,
        verified_at: now,
        confidence: priceConfidence,
      })
    }
  }

  await supabase
    .from('price_reports')
    .update({ status: 'verified', verified_at: now, verified_by: 'admin' })
    .eq('id', id)

  return { status: 200, body: { success: true, action: 'approved', pubSlug: slug } }
}
