import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

interface CspReport {
  'blocked-uri'?: unknown
  'document-uri'?: unknown
  'effective-directive'?: unknown
  'violated-directive'?: unknown
}

const MAX_REPORT_BYTES = 8_192
const REPORT_SAMPLE_RATE = 0.01
const SITE_ORIGIN = 'https://perthpintprices.com'
const CSP_DIRECTIVES = new Set([
  'base-uri', 'child-src', 'connect-src', 'default-src', 'font-src', 'form-action',
  'frame-ancestors', 'frame-src', 'img-src', 'manifest-src', 'media-src',
  'object-src', 'script-src', 'script-src-attr', 'script-src-elem', 'style-src',
  'style-src-attr', 'style-src-elem', 'worker-src',
])

function safeOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || !value || value.length > 2_048) return null
  if (value === 'inline' || value === 'eval' || value === 'self') return value
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function sanitizeCspReport(body: unknown) {
  const envelope = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const report = (envelope['csp-report'] ?? envelope.body ?? envelope) as CspReport
  return {
    blockedOrigin: safeOrigin(report?.['blocked-uri']),
    documentOrigin: safeOrigin(report?.['document-uri']),
    directive: validDirective(report?.['effective-directive']) ?? validDirective(report?.['violated-directive']),
  }
}

function validDirective(value: unknown): string | null {
  return typeof value === 'string' && CSP_DIRECTIVES.has(value) ? value : null
}

interface CspReportDeps {
  capture?: typeof Sentry.captureMessage
  random?: () => number
}

export async function handleCspReport(req: NextRequest, deps: CspReportDeps = {}) {
  const declaredLength = Number(req.headers.get('content-length') || 0)
  if (declaredLength > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 })

  let body: unknown
  try {
    const rawBody = await req.text()
    if (rawBody.length > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 })
    body = JSON.parse(rawBody)
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const report = sanitizeCspReport(body)
  if (report.documentOrigin !== SITE_ORIGIN || !report.directive) return new NextResponse(null, { status: 204 })
  if ((deps.random ?? Math.random)() < REPORT_SAMPLE_RATE) {
    const capture = deps.capture ?? Sentry.captureMessage
    capture('CSP violation', {
      level: 'warning',
      tags: { directive: report.directive },
      extra: report,
    })
  }
  return new NextResponse(null, { status: 204 })
}
