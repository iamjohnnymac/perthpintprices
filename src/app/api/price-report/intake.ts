import { normalizeReportSubmissionSource } from '@/lib/priceProvenance'

export interface PreparedPriceReport {
  pubSlug: string
  isMenuScan: boolean
  insertData: Record<string, unknown>
}

export type PriceReportPreparation =
  | { ok: true; value: PreparedPriceReport }
  | { ok: false; error: string; status: number }

export function preparePriceReport(body: any, ipHash: string): PriceReportPreparation {
  const {
    pub_slug,
    reported_price,
    beer_type,
    reporter_name,
    outdated,
    notes,
    price_type,
    submission_source,
    source_url,
    evidence_text,
    observed_at,
    raw_extraction,
    extractor_version,
  } = body

  const isOutdatedReport = outdated === true
  const normalizedSubmissionSource = normalizeReportSubmissionSource(submission_source)

  if (!pub_slug) {
    return { ok: false, error: 'pub_slug is required', status: 400 }
  }
  if (submission_source !== undefined && !normalizedSubmissionSource) {
    return { ok: false, error: 'submission_source is invalid', status: 400 }
  }
  if (!isOutdatedReport && !reported_price) {
    return { ok: false, error: 'reported_price is required', status: 400 }
  }

  let price = 0
  if (reported_price) {
    price = parseFloat(reported_price)
    if (isNaN(price) || price < 3 || price > 30) {
      return { ok: false, error: 'Price must be between $3 and $30', status: 400 }
    }
  }

  const observedAt = parseOptionalDate(observed_at)
  if (observed_at !== undefined && !observedAt) {
    return { ok: false, error: 'observed_at is invalid', status: 400 }
  }

  const storedSubmissionSource = isOutdatedReport
    ? 'stale_flag'
    : normalizedSubmissionSource || 'manual'
  const legacyMenuScan = typeof notes === 'string' && notes.toLowerCase().includes('menu scan')
  const isMenuScan = storedSubmissionSource === 'menu_scan' || legacyMenuScan

  return {
    ok: true,
    value: {
      pubSlug: pub_slug,
      isMenuScan,
      insertData: {
        pub_slug,
        // Null, not 0: the DB's reported_price check rejects out-of-range
        // prices, and checks pass on null. A stale flag has no price.
        reported_price: isOutdatedReport ? null : price,
        beer_type: beer_type || null,
        reporter_name: reporter_name || 'Anonymous',
        ip_hash: ipHash,
        report_type: isOutdatedReport ? 'outdated_flag' : (price_type === 'happy_hour' ? 'happy_hour_report' : 'price_report'),
        notes: notes || null,
        submission_source: storedSubmissionSource,
        source_url: optionalString(source_url),
        evidence_text: optionalString(evidence_text),
        observed_at: observedAt,
        raw_extraction: raw_extraction ?? null,
        extractor_version: optionalString(extractor_version),
      },
    },
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseOptionalDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
