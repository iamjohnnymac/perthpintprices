'use client'

import { track } from '@vercel/analytics'

export type AnalyticsPropertyValue = string | number | boolean
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue | null | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function cleanProperties(properties: AnalyticsProperties): Record<string, AnalyticsPropertyValue> {
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, AnalyticsPropertyValue] => (
      entry[1] !== null && entry[1] !== undefined
    )),
  )
}

export function trackSiteEvent(name: string, properties: AnalyticsProperties = {}) {
  const clean = cleanProperties(properties)
  track(name, clean)

  if (typeof window !== 'undefined') {
    window.gtag?.('event', name, clean)
  }
}
