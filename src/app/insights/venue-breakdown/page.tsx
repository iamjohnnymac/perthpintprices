import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import VenueBreakdownPage from './VenueBreakdownPage'

export const metadata: Metadata = {
  title: "Perth Pub Price Analysis — Venue Breakdown by Price Bracket | Arvo",
  description: "Deep dive into Perth's pub pricing. See how venues stack up across price brackets, find undervalued gems, and spot overpriced outliers.",
  alternates: { canonical: 'https://perthpintprices.com/insights/venue-breakdown' },
  openGraph: {
    title: "Perth Pub Venue Price Analysis | Arvo",
    description: "Deep dive into Perth's pub pricing. Venue breakdowns, price brackets, and hidden gems.",
    url: 'https://perthpintprices.com/insights/venue-breakdown',
    type: 'website',
    siteName: 'Arvo',
  },
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
