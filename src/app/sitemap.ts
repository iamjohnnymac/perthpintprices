import { MetadataRoute } from 'next'
import { getAllPubLastModifiedPairs, getIndexablePubSlugPairs, getAllSuburbs } from '@/lib/supabase'
import { articles, absoluteArticleUrl } from '@/lib/articles'
import { BASE_URL, absolutePubUrl, absoluteSuburbUrl, toSuburbSlug } from '@/lib/urls'

// Regenerate hourly so new pubs added to Supabase appear in the sitemap
// within 60 min. Without this, Next defaults to build-time generation and
// the sitemap would only refresh on redeploy.
export const revalidate = 3600

const FALLBACK_LAST_MODIFIED = '2026-05-31T00:00:00.000Z'

function toLastModified(value: string | null | undefined): string {
  if (!value) return FALLBACK_LAST_MODIFIED
  return new Date(value).toISOString()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugPairs, allPubDates, suburbs] = await Promise.all([
    getIndexablePubSlugPairs(),
    getAllPubLastModifiedPairs(),
    getAllSuburbs(),
  ])
  const latestPubModified = allPubDates
    .map(pair => toLastModified(pair.lastModified))
    .sort()
    .at(-1) || FALLBACK_LAST_MODIFIED

  const latestBySuburb = new Map<string, string>()
  for (const pubDate of allPubDates) {
    const suburbSlug = toSuburbSlug(pubDate.suburb)
    const lastModified = toLastModified(pubDate.lastModified)
    const existing = latestBySuburb.get(suburbSlug)
    if (!existing || lastModified > existing) {
      latestBySuburb.set(suburbSlug, lastModified)
    }
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: latestPubModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/discover`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/insights`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/insights/pint-of-the-day`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/insights/pint-index`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/insights/tonights-best-bets`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/insights/suburb-rankings`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/insights/venue-breakdown`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/beer-weather`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/guides/sunset-sippers`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/punt-and-pints`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/dad-bar`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/cozy-corners`, lastModified: latestPubModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/happy-hour`, lastModified: latestPubModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/articles`, lastModified: articles[0]?.updatedAt || FALLBACK_LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const articleRoutes: MetadataRoute.Sitemap = articles.map(article => ({
    url: absoluteArticleUrl(article.slug),
    lastModified: article.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const suburbRoutes: MetadataRoute.Sitemap = suburbs.map(s => ({
    url: absoluteSuburbUrl(s.slug),
    lastModified: latestBySuburb.get(s.slug) || latestPubModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const pubRoutes: MetadataRoute.Sitemap = slugPairs.map(pair => ({
    url: absolutePubUrl(pair),
    lastModified: toLastModified(pair.lastModified),
    changeFrequency: 'weekly' as const,
    priority: pair.indexabilityTier === 'A' ? 0.6 : 0.5,
  }))

  return [...staticRoutes, ...articleRoutes, ...suburbRoutes, ...pubRoutes]
}
