import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { getCachedPubs } from '@/lib/cachedPubs'
import { slimPubForFeature } from '@/lib/pubPhoto'
import BeerWeatherPage from './BeerWeatherPage'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Beer Weather Perth',
  description: "What the forecast says about where to drink in Perth — beach pubs and beer gardens when it's hot, somewhere with a roof when it's not.",
  alternates: { canonical: 'https://perthpintprices.com/guides/beer-weather' },
  openGraph: {
    title: 'Beer Weather Perth | Perth Pint Prices',
    description: "Live Perth weather matched to the right pub for the day.",
    url: 'https://perthpintprices.com/guides/beer-weather',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Beer Weather Perth | Perth Pint Prices' }],
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
        { name: 'Beer Weather', url: 'https://perthpintprices.com/guides/beer-weather' },
      ]} />
      {/* The H1 + intro now render visibly via FeaturePageShell, so this crawl
          block only carries the nav links. */}
      <div className="sr-only" aria-hidden="true">
        <Link href="/">Home</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/happy-hour">Happy Hours</Link>
      </div>
      <BeerWeatherPage initialPubs={initialPubs} />
    </>
  )
}
