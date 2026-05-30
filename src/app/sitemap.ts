import { MetadataRoute } from 'next'
import { getAllPubSlugPairs, getAllSuburbs } from '@/lib/supabase'
import { BASE_URL, absolutePubUrl, absoluteSuburbUrl } from '@/lib/urls'

// Regenerate hourly so new pubs added to Supabase appear in the sitemap
// within 60 min. Without this, Next defaults to build-time generation and
// the sitemap would only refresh on redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugPairs, suburbs] = await Promise.all([
    getAllPubSlugPairs(),
    getAllSuburbs(),
  ])
  const now = new Date().toISOString()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/discover`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/insights`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/insights/pint-of-the-day`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/insights/pint-index`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/insights/tonights-best-bets`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/insights/suburb-rankings`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/insights/venue-breakdown`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/beer-weather`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/guides/sunset-sippers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/punt-and-pints`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/dad-bar`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides/cozy-corners`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/happy-hour`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]

  const suburbRoutes: MetadataRoute.Sitemap = suburbs.map(s => ({
    url: absoluteSuburbUrl(s.slug),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const pubRoutes: MetadataRoute.Sitemap = slugPairs.map(pair => ({
    url: absolutePubUrl(pair),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...suburbRoutes, ...pubRoutes]
}
