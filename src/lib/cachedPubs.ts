import { unstable_cache } from 'next/cache'
import {
  fetchPubListRows,
  fetchHappyHourPubRows,
  toPub,
  getAllSuburbs,
  getNearbySuburbs,
  getSiteStats,
  getSuburbBySlug,
  getSuburbPubs,
  type SuburbInfo,
} from './supabase'
import type { Pub } from '@/types/pub'

/**
 * Shared, cached pubs-table reads for server pages.
 *
 * Before this existed, ~20 routes each pulled the full pubs table (~2MB)
 * straight from Supabase on every revalidation — and the suburb pages pulled it
 * up to four times per render (stats + suburb + nearby + metadata). One
 * production build cost ~167MB of Supabase egress; steady-state traffic blew
 * the 5GB/month free tier. These wrappers make every route share ONE pull per
 * hour (or until a price write calls `revalidateTag('pubs')`).
 *
 * Design constraints:
 * - Raw ROWS are cached, not Pub objects: toPub() computes the live happy-hour
 *   status and effective price, so it must run fresh per render.
 * - The list pull excludes google_opening_hours (~735KB) — Vercel's data cache
 *   silently rejects entries over 2MB, and the full table would not fit. The
 *   happy-hour pull keeps the full columns but only for happy-hour pubs, which
 *   stays well under the limit.
 * - Client components must not import this file (next/cache is server-only).
 */

const REVALIDATE_SECONDS = 3600
export const PUBS_CACHE_TAG = 'pubs'

const cachedPubListRows = unstable_cache(fetchPubListRows, ['pubs:list-rows'], {
  revalidate: REVALIDATE_SECONDS,
  tags: [PUBS_CACHE_TAG],
})

const cachedHappyHourRows = unstable_cache(fetchHappyHourPubRows, ['pubs:happy-hour-rows'], {
  revalidate: REVALIDATE_SECONDS,
  tags: [PUBS_CACHE_TAG],
})

/** All pubs, without google_opening_hours. Use anywhere the hours aren't rendered. */
export async function getCachedPubs(): Promise<Pub[]> {
  return (await cachedPubListRows()).map(toPub)
}

/** Happy-hour pubs with full columns (hours/photos/write-ups) for the listicle pages. */
export async function getCachedHappyHourPubs(): Promise<Pub[]> {
  return (await cachedHappyHourRows()).map(toPub)
}

export async function getCachedSiteStats() {
  return getSiteStats(await getCachedPubs())
}

export async function getCachedAllSuburbs(): Promise<SuburbInfo[]> {
  return getAllSuburbs(await getCachedPubs())
}

export async function getCachedSuburbBySlug(slug: string): Promise<SuburbInfo | null> {
  return getSuburbBySlug(slug, await getCachedPubs())
}

export async function getCachedSuburbPubs(suburbName: string): Promise<Pub[]> {
  return getSuburbPubs(suburbName, await getCachedPubs())
}

export async function getCachedNearbySuburbs(suburbName: string, limit: number = 5): Promise<SuburbInfo[]> {
  return getNearbySuburbs(suburbName, limit, await getCachedPubs())
}
