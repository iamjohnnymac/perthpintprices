import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SuburbRankingsPage from './SuburbRankingsPage'

export const metadata: Metadata = {
  title: "Perth Suburb Pint Rankings: Cheapest Areas | Perth Pint Prices",
  description: "Compare pint prices across every Perth suburb. Find the cheapest suburbs for a beer, from Fremantle to Joondalup. Ranked by average pint price.",
  alternates: { canonical: 'https://perthpintprices.com/insights/suburb-rankings' },
  openGraph: {
    title: "Perth Suburb Pint Price Rankings | Perth Pint Prices",
    description: "Compare pint prices across every Perth suburb. Find the cheapest areas for a beer.",
    url: 'https://perthpintprices.com/insights/suburb-rankings',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Suburb Pint Rankings - Cheapest Areas for a Beer' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Suburb Rankings', url: 'https://perthpintprices.com/insights/suburb-rankings' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Perth Suburb Pint Rankings - Cheapest Areas for a Beer</h1>
        <p>Compare pint prices across every Perth suburb. See which areas offer the cheapest pints on average, from Fremantle to Joondalup, ranked by community-verified prices.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <SuburbRankingsPage />
    </>
  )
}
