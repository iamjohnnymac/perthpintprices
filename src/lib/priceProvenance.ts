export type PriceConfidence = 'high' | 'medium' | 'low'
export type ReportSubmissionSource =
  | 'manual'
  | 'menu_scan'
  | 'tier_c_report_hero'
  | 'official_menu'
  | 'venue_submission'
  | 'community_bounty'
  | 'aggregator_lead'
  | 'stale_flag'

export type PriceSource =
  | 'andrew'
  | 'crowdsourced'
  | 'menu_scan'
  | 'official_menu'
  | 'venue_submission'
  | 'aggregator_lead'
  | 'stale_flag'

export const REPORT_SUBMISSION_SOURCES: readonly ReportSubmissionSource[] = [
  'manual',
  'menu_scan',
  'tier_c_report_hero',
  'official_menu',
  'venue_submission',
  'community_bounty',
  'aggregator_lead',
  'stale_flag',
]

interface ReportProvenanceInput {
  submission_source?: unknown
  source_url?: unknown
  evidence_text?: unknown
  notes?: unknown
  report_type?: unknown
}

export function normalizePriceConfidence(value: unknown): PriceConfidence | null {
  if (typeof value !== 'string') return null
  const confidence = value.trim().toLowerCase()
  return confidence === 'high' || confidence === 'medium' || confidence === 'low'
    ? confidence
    : null
}

export function normalizeReportSubmissionSource(value: unknown): ReportSubmissionSource | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase().replace(/-/g, '_')
  return REPORT_SUBMISSION_SOURCES.includes(normalized as ReportSubmissionSource)
    ? normalized as ReportSubmissionSource
    : null
}

export function reportSubmissionSource(
  submissionSource: unknown,
  notes?: unknown,
  reportType?: unknown,
): ReportSubmissionSource {
  const normalized = normalizeReportSubmissionSource(submissionSource)
  if (normalized) return normalized

  if (reportType === 'outdated_flag') return 'stale_flag'
  if (typeof notes === 'string') {
    const normalizedNotes = notes.toLowerCase()
    if (normalizedNotes.includes('menu scan')) return 'menu_scan'
    if (
      normalizedNotes.includes('[source:tier-c-report-hero]') ||
      normalizedNotes.includes('[source:tier_c_report_hero]')
    ) {
      return 'tier_c_report_hero'
    }
  }

  return 'manual'
}

export function priceReportSource(input: ReportProvenanceInput | unknown, notes?: unknown): PriceSource {
  const submissionSource = isReportProvenanceInput(input)
    ? reportSubmissionSource(input.submission_source, input.notes, input.report_type)
    : reportSubmissionSource(input, notes ?? input)

  if (
    submissionSource === 'manual' ||
    submissionSource === 'tier_c_report_hero' ||
    submissionSource === 'community_bounty'
  ) {
    return 'crowdsourced'
  }

  return submissionSource
}

export function priceReportConfidence(input: ReportProvenanceInput | unknown, notes?: unknown): PriceConfidence {
  const submissionSource = isReportProvenanceInput(input)
    ? reportSubmissionSource(input.submission_source, input.notes, input.report_type)
    : reportSubmissionSource(input, notes ?? input)

  if (submissionSource === 'official_menu') {
    return hasEvidence(input) && hasSourceUrl(input) ? 'high' : 'medium'
  }
  if (submissionSource === 'venue_submission') return 'medium'
  if (submissionSource === 'menu_scan') return 'low'
  if (submissionSource === 'community_bounty') return hasEvidence(input) ? 'medium' : 'low'
  if (submissionSource === 'aggregator_lead') return 'low'
  if (submissionSource === 'stale_flag') return 'low'
  return 'medium'
}

export function describePriceSource(source: string | null | undefined): string | null {
  if (!source) return null
  const normalized = source.trim().toLowerCase()

  if (normalized === 'andrew' || normalized === 'phone_agent' || normalized.startsWith('elevenlabs')) {
    return 'by Andrew'
  }
  if (normalized === 'menu_scan') {
    return 'from a menu scan'
  }
  if (normalized === 'official_menu') {
    return 'from an official menu'
  }
  if (normalized === 'venue_submission') {
    return 'from the venue'
  }
  if (normalized === 'aggregator_lead') {
    return 'spotted online'
  }
  if (normalized === 'crowdsourced' || normalized === 'manual' || normalized === 'community_bounty') {
    return 'by a local'
  }
  if (normalized === 'tier_c_report_hero') {
    return 'by a local'
  }

  return `by ${source}`
}

function isReportProvenanceInput(value: unknown): value is ReportProvenanceInput {
  return typeof value === 'object' && value !== null
}

function hasEvidence(value: unknown): boolean {
  return isReportProvenanceInput(value) &&
    typeof value.evidence_text === 'string' &&
    value.evidence_text.trim().length > 0
}

function hasSourceUrl(value: unknown): boolean {
  return isReportProvenanceInput(value) &&
    typeof value.source_url === 'string' &&
    value.source_url.trim().length > 0
}
