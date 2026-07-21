import { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import DiscoverClient from './DiscoverClient'
import { getCachedPubs } from '@/lib/cachedPubs'
import DataToolsRail from '@/components/DataToolsRail'
import { prepareDiscoverPubs } from '@/lib/discoverPubs'

export const metadata: Metadata = {
  title: 'Discover: Perth Pint Guides, Stats & Pub Picks',
  description: 'Live pint data, suburb rankings, sunset spots, dad bars, and more. Everything beyond the price table.',
  alternates: {
    canonical: 'https://perthpintprices.com/discover',
  },
  openGraph: {
    title: 'Discover: Perth Pint Guides, Stats & Pub Picks | Perth Pint Prices',
    description: 'Live pint data, suburb rankings, sunset spots, dad bars, and more.',
    url: 'https://perthpintprices.com/discover',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: 'https://perthpintprices.com/og-image.png',
        width: 1200,
        height: 630,
        alt: "Discover Perth's best pints. Guides, stats & pub picks",
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 300

export default async function DiscoverPage() {
  // Server-fetch so the page content ships in the initial HTML instead of
  // spinning while the browser round-trips to Supabase.
  const initialPubs = prepareDiscoverPubs(await getCachedPubs())

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover' },
      ]} />
      <DiscoverClient initialPubs={initialPubs} dataToolsRail={<DataToolsRail />} />
    </>
  )
}
