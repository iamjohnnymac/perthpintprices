import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForFeature } from '@/lib/pubPhoto'
import VenueBreakdownPage from './VenueBreakdownPage'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Perth Pub Prices by Bracket',
  description: "How Perth's pubs stack up by the numbers — the price spread, how many sit under $10, and which suburbs run cheap.",
  alternates: { canonical: 'https://perthpintprices.com/insights/venue-breakdown' },
  openGraph: {
    title: 'Perth Pub Prices by Bracket | Perth Pint Prices',
    description: "How Perth's pubs stack up by price bracket. Where the value is and where it isn't.",
    url: 'https://perthpintprices.com/insights/venue-breakdown',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Pub Prices by Bracket' }],
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
        { name: 'Venue Breakdown', url: 'https://perthpintprices.com/insights/venue-breakdown' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <p>How every Perth pub we track stacks up by the numbers — the price spread, how many sit under $10, and which suburbs run cheap. The data behind the Index.</p>
        <Link href="/">Home</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/happy-hour">Happy Hours</Link>
      </div>
      <VenueBreakdownPage initialPubs={initialPubs} />
    </>
  )
}
