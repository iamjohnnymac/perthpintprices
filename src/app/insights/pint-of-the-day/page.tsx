import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintOfTheDayPage from './PintOfTheDayPage'

export const metadata: Metadata = {
  title: "Perth Pint of the Day: Today's Best Value Beer",
  description: "Today's best value pint in Perth, algorithmically picked from 300+ venues. Updated daily with verified prices from real pub-goers.",
  alternates: { canonical: 'https://perthpintprices.com/insights/pint-of-the-day' },
  openGraph: {
    title: "Perth Pint of the Day | Perth Pint Prices",
    description: "Today's best value pint in Perth, picked from 300+ venues.",
    url: 'https://perthpintprices.com/insights/pint-of-the-day',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Pint of the Day - Today\'s Best Value Beer' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Pint of the Day', url: 'https://perthpintprices.com/insights/pint-of-the-day' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Perth Pint of the Day - Today&#39;s Best Value Beer</h1>
        <p>Today&#39;s best value pint in Perth, algorithmically selected from 300+ venues. Updated daily with community-verified prices from real pub-goers across Perth suburbs.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <PintOfTheDayPage />
    </>
  )
}
