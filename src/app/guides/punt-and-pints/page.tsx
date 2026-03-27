import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PuntAndPintsPage from './PuntAndPintsPage'

export const metadata: Metadata = {
  title: "Punt & Pints: Perth Pubs with TAB Facilities | Arvo",
  description: "Find Perth pubs with TAB facilities. Watch the races, place a bet, and enjoy a cold pint. Verified prices across Perth.",
  alternates: { canonical: 'https://perthpintprices.com/guides/punt-and-pints' },
  openGraph: {
    title: "Punt & Pints: Perth Pubs with TAB | Arvo",
    description: "Perth pubs with TAB facilities. Watch the races with a cold pint.",
    url: 'https://perthpintprices.com/guides/punt-and-pints',
    type: 'website',
    siteName: 'Arvo',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Punt and Pints - Perth Pubs with TAB | Arvo' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Punt & Pints', url: 'https://perthpintprices.com/guides/punt-and-pints' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Punt and Pints - Perth Pubs with TAB Facilities</h1>
        <p>Find Perth pubs with TAB facilities for watching the races while enjoying a cold pint. Verified prices and locations across Perth suburbs.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <PuntAndPintsPage />
    </>
  )
}
