import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import VenueBreakdownPage from './VenueBreakdownPage'

export const metadata: Metadata = {
  title: "Perth Pub Prices by Bracket | Arvo",
  description: "How Perth's 300+ pubs stack up by price bracket. See which venues are cheap, which are overpriced, and where the value actually is.",
  alternates: { canonical: 'https://perthpintprices.com/insights/venue-breakdown' },
  openGraph: {
    title: "Perth Pub Prices by Bracket | Arvo",
    description: "How Perth's pubs stack up by price bracket. Where the value is and where it isn't.",
    url: 'https://perthpintprices.com/insights/venue-breakdown',
    type: 'website',
    siteName: 'Arvo',
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Insights', url: 'https://perthpintprices.com/insights' },
        { name: 'Venue Breakdown' },
      ]} />
      <VenueBreakdownPage />
    </>
  )
}
