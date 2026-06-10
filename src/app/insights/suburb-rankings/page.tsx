import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { getPubs } from '@/lib/supabase'
import { slimPubForFeature } from '@/lib/pubPhoto'
import SuburbRankingsPage from './SuburbRankingsPage'

export const metadata: Metadata = {
  title: 'Perth Suburb Pint Rankings: Cheapest Areas',
  description: "Perth suburbs ranked cheapest to dearest by average verified pint, each price dated. Which areas run cheap, and which don't.",
  alternates: { canonical: 'https://perthpintprices.com/insights/suburb-rankings' },
  openGraph: {
    title: 'Perth Suburb Pint Price Rankings | Perth Pint Prices',
    description: "Compare pint prices across every Perth suburb. Find the cheapest areas for a beer.",
    url: 'https://perthpintprices.com/insights/suburb-rankings',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Suburb Pint Rankings - Cheapest Areas for a Beer' }],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 300

export default async function Page() {
  // Server-fetch so the page content ships in the initial HTML instead of
  // spinning while the browser round-trips to Supabase. Slimmed to keep the
  // serialised payload under crawl limits.
  const initialPubs = (await getPubs()).map(slimPubForFeature)

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Suburb Rankings', url: 'https://perthpintprices.com/insights/suburb-rankings' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <p>Every Perth suburb ranked cheapest to dearest by its average verified pint, each price dated. See which areas run cheap and which sit at the top.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <SuburbRankingsPage initialPubs={initialPubs} />
    </>
  )
}
