import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForFeature } from '@/lib/pubPhoto'
import PuntAndPintsPage from './PuntAndPintsPage'

export const metadata: Metadata = {
  title: 'Punt & Pints: Perth Pubs with TAB Facilities',
  description: "A TAB, the races on, and a pint that won't clean you out. The Perth pubs that do both, with verified prices.",
  alternates: { canonical: 'https://perthpintprices.com/guides/punt-and-pints' },
  openGraph: {
    title: 'Punt & Pints: Perth Pubs with TAB | Perth Pint Prices',
    description: "Perth pubs with TAB facilities. Watch the races with a cold pint.",
    url: 'https://perthpintprices.com/guides/punt-and-pints',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Punt and Pints - Perth Pubs with TAB | Perth Pint Prices' }],
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
        { name: 'Punt & Pints', url: 'https://perthpintprices.com/guides/punt-and-pints' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <p>Find Perth pubs with TAB facilities for watching the races while enjoying a cold pint. Verified prices and locations across Perth suburbs.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <PuntAndPintsPage initialPubs={initialPubs} />
    </>
  )
}
