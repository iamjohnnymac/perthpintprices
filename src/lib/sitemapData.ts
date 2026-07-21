import { articles, absoluteArticleUrl } from '@/lib/articles'
import { HAPPY_HOUR_DAYS } from '@/lib/happyHourDays'
import { getCachedAllSuburbs } from '@/lib/cachedPubs'
import { getAllPubLastModifiedPairs, getIndexablePubSlugPairs, type IndexablePubSlugPair, type PubLastModifiedPair } from '@/lib/supabase'
import { TRANSPORT_HUBS } from '@/lib/transportHubs'
import { absolutePubUrl, absoluteSuburbUrl, BASE_URL, toSuburbSlug } from '@/lib/urls'
import { getSuburbIndexability } from '@/lib/suburbIndexability'
import type { SitemapIndexEntry, SitemapUrlEntry } from './sitemapXml'

export const SITEMAP_REVALIDATE_SECONDS = 3600
export const SITEMAP_FALLBACK_LAST_MODIFIED = '2026-05-31T00:00:00.000Z'

type SuburbSitemapInput = { slug: string; pubCount: number }

// These dates change only when the corresponding editorial/template content is
// changed. Live data pages deliberately use their relevant pub-data timestamp.
const EDITORIAL_LAST_MODIFIED: Record<string, string> = {
  '/guides/beer-weather': '2026-06-28T21:07:09.000Z',
  '/guides/cozy-corners': '2026-06-28T21:07:09.000Z',
  '/guides/dad-bar': '2026-06-28T21:07:09.000Z',
  '/guides/punt-and-pints': '2026-06-28T21:07:09.000Z',
  '/guides/sunset-sippers': '2026-06-28T21:07:09.000Z',
  '/cheapest-pints': '2026-06-12T03:00:19.000Z',
  '/how-much-is-a-pint-in-perth': '2026-06-12T03:00:19.000Z',
  '/student-pints-perth': '2026-06-12T03:00:19.000Z',
}

function normaliseLastModified(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function latest(values: Array<string | null | undefined>, fallback = SITEMAP_FALLBACK_LAST_MODIFIED): string {
  return values
    .map(normaliseLastModified)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) || fallback
}

function lastModifiedBySuburb(allPubDates: PubLastModifiedPair[]): Map<string, string> {
  const dates = new Map<string, string>()
  for (const pair of allPubDates) {
    const modified = normaliseLastModified(pair.lastModified)
    if (!modified) continue
    const slug = toSuburbSlug(pair.suburb)
    const current = dates.get(slug)
    if (!current || modified > current) dates.set(slug, modified)
  }
  return dates
}

function contentEntry(path: string, lastModified: string, changeFrequency: SitemapUrlEntry['changeFrequency'], priority: number): SitemapUrlEntry {
  return { url: `${BASE_URL}${path}`, lastModified, changeFrequency, priority }
}

export interface SitemapRouteSets {
  index: SitemapIndexEntry[]
  content: SitemapUrlEntry[]
  suburbs: SitemapUrlEntry[]
  pubs: SitemapUrlEntry[]
}

export function buildSitemapRouteSets(
  slugPairs: IndexablePubSlugPair[],
  allPubDates: PubLastModifiedPair[],
  suburbs: SuburbSitemapInput[],
): SitemapRouteSets {
  const latestPubModified = latest(allPubDates.map(pair => pair.lastModified))
  const suburbDates = lastModifiedBySuburb(allPubDates)
  const content: SitemapUrlEntry[] = [
    contentEntry('', latestPubModified, 'daily', 1.0),
    contentEntry('/discover', latestPubModified, 'daily', 0.9),
    contentEntry('/suburbs', '2026-06-12T03:00:19.000Z', 'weekly', 0.8),
    contentEntry('/happy-hour', latestPubModified, 'daily', 0.8),
    contentEntry('/insights/pint-of-the-day', latestPubModified, 'daily', 0.8),
    contentEntry('/insights/pint-index', latestPubModified, 'daily', 0.8),
    contentEntry('/insights/tonights-best-bets', latestPubModified, 'daily', 0.8),
    contentEntry('/insights/suburb-rankings', latestPubModified, 'weekly', 0.7),
    contentEntry('/insights/venue-breakdown', latestPubModified, 'weekly', 0.7),
    ...Object.entries(EDITORIAL_LAST_MODIFIED).map(([path, lastModified]) => contentEntry(path, lastModified, 'weekly', 0.7)),
    contentEntry('/articles', latest(articles.map(article => article.updatedAt)), 'weekly', 0.8),
    ...HAPPY_HOUR_DAYS.map(day => contentEntry(`/happy-hour/${day.slug}`, latestPubModified, 'daily', 0.7)),
    ...TRANSPORT_HUBS.map(hub => contentEntry(`/${hub.slug}`, latestPubModified, 'weekly', 0.7)),
    ...articles.map(article => ({
      url: absoluteArticleUrl(article.slug),
      lastModified: article.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
  const suburbFallback = latestPubModified
  const suburbRoutes = suburbs
    .filter(suburb => getSuburbIndexability({ legitimatePubCount: suburb.pubCount }).isIndexable)
    .map(suburb => ({
      url: absoluteSuburbUrl(suburb.slug),
      lastModified: suburbDates.get(suburb.slug) || suburbFallback,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  const pubRoutes = slugPairs.map(pair => ({
    url: absolutePubUrl(pair),
    lastModified: normaliseLastModified(pair.lastModified) || SITEMAP_FALLBACK_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: pair.indexabilityTier === 'A' ? 0.6 : 0.5,
  }))
  const ensureUnique = (entries: SitemapUrlEntry[], label: string) => {
    if (new Set(entries.map(entry => entry.url)).size !== entries.length) throw new Error(`Duplicate ${label} sitemap URL`)
    return entries
  }

  return {
    index: [
      { url: `${BASE_URL}/sitemap-content.xml`, lastModified: latest(content.map(entry => entry.lastModified)) },
      { url: `${BASE_URL}/sitemap-suburbs.xml`, lastModified: latest(suburbRoutes.map(entry => entry.lastModified), suburbFallback) },
      { url: `${BASE_URL}/sitemap-pubs.xml`, lastModified: latest(pubRoutes.map(entry => entry.lastModified)) },
    ],
    content: ensureUnique(content, 'content'),
    suburbs: ensureUnique(suburbRoutes, 'suburb'),
    pubs: ensureUnique(pubRoutes, 'pub'),
  }
}

export async function getSitemapRouteSets(): Promise<SitemapRouteSets> {
  const [slugPairs, allPubDates, suburbs] = await Promise.all([
    getIndexablePubSlugPairs(),
    getAllPubLastModifiedPairs(),
    getCachedAllSuburbs(),
  ])
  return buildSitemapRouteSets(slugPairs, allPubDates, suburbs)
}
