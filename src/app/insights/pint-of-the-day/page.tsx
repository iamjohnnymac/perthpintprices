import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintOfTheDayPage from './PintOfTheDayPage'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Perth Pint of the Day: Today's Best Value Beer",
  description: "One pub, one price, picked daily for value — today's pint, how it compares to the suburb average, and the date we last checked it.",
  alternates: { canonical: 'https://perthpintprices.com/insights/pint-of-the-day' },
  openGraph: {
    title: "Perth Pint of the Day | Perth Pint Prices",
    description: "Today's best value pint in Perth, picked from the venues we track.",
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
        <p>One pub, one price, picked daily for value. Today&#39;s pint, how it compares to the suburb average, and the date we last checked — updated every day from verified prices.</p>
        <Link href="/">Home</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/happy-hour">Happy Hours</Link>
      </div>
      <PintOfTheDayPage />
    </>
  )
}
