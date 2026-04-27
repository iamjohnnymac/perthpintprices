import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import VenueBreakdownPage from './VenueBreakdownPage'

export const metadata: Metadata = {
  title: 'Perth Pub Prices by Bracket',
  description: "How Perth's 300+ pubs stack up by price bracket. See which venues are cheap, which are overpriced, and where the value actually is.",
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

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Venue Breakdown', url: 'https://perthpintprices.com/insights/venue-breakdown' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Perth Pub Prices by Bracket</h1>
        <p>See how Perth&#39;s 300+ pubs stack up by price bracket. Discover which venues offer genuine value, which are overpriced, and where the best deals are hiding.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <VenueBreakdownPage />
    </>
  )
}
