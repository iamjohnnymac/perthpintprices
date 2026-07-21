import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForFeature } from '@/lib/pubPhoto'
import CozyCornersPage from './CozyCornersPage'
import GuideEvidence from '@/components/GuideEvidence'

export const metadata: Metadata = {
  title: 'Cosy Corners Perth: Best Rainy Day Pubs',
  description: "Low light, a fireplace, a corner you don't have to share. The Perth pubs built for a slow pint when it's cold or wet out.",
  alternates: { canonical: 'https://perthpintprices.com/guides/cozy-corners' },
  openGraph: {
    title: 'Cosy Corners Perth: Best Rainy Day Pubs | Perth Pint Prices',
    description: "Perth's cosiest pubs for a rainy day — low light, a fireplace, and a slow pint when it's wet out.",
    url: 'https://perthpintprices.com/guides/cozy-corners',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Cosy Corners Perth - Best Rainy Day Pubs | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 300

export default async function Page() {
  // Server-fetch so the page content ships in the initial HTML instead of
  // spinning while the browser round-trips to Supabase. Slimmed to keep the
  // serialised payload under crawl limits.
  const initialPubs = (await getCachedPubs()).map(slimPubForFeature)

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Cosy Corners', url: 'https://perthpintprices.com/guides/cozy-corners' },
      ]} />
      <GuideEvidence kind="cozy" pubs={initialPubs} />
      <CozyCornersPage initialPubs={initialPubs} />
    </>
  )
}
