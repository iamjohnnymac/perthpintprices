import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintIndexPage from './PintIndexPage'

export const metadata: Metadata = {
  title: 'Perth Pint Index™: Live Beer Price Tracker',
  description: "Track Perth's average pint price over time. The Perth Pint Index™ monitors beer pricing trends across 300+ venues with weekly snapshots.",
  alternates: { canonical: 'https://perthpintprices.com/insights/pint-index' },
  openGraph: {
    title: 'Perth Pint Index™: Live Beer Price Tracker | Perth Pint Prices',
    description: "Track Perth's average pint price over time across 300+ venues.",
    url: 'https://perthpintprices.com/insights/pint-index',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth Pint Index - Live Beer Price Tracker' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Perth Pint Index™', url: 'https://perthpintprices.com/insights/pint-index' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Perth Pint Index - Live Beer Price Tracker</h1>
        <p>Track Perth's average pint price over time. The Perth Pint Index monitors beer pricing trends across 300+ venues with weekly snapshots and historical data.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <PintIndexPage />
    </>
  )
}
