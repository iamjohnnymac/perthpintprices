import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SunsetSippersPage from './SunsetSippersPage'

export const metadata: Metadata = {
  title: 'Sunset Sippers Perth: Best Golden Hour Pubs',
  description: "West-facing, a view, and a pint timed to the sunset. Where to be when the sun drops over the Indian Ocean.",
  alternates: { canonical: 'https://perthpintprices.com/guides/sunset-sippers' },
  openGraph: {
    title: 'Sunset Sippers Perth: Best Golden Hour Pubs | Perth Pint Prices',
    description: "Perth's best sunset pubs with west-facing views and beer gardens.",
    url: 'https://perthpintprices.com/guides/sunset-sippers',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Sunset Sippers Perth - Best Golden Hour Pubs | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Sunset Sippers', url: 'https://perthpintprices.com/guides/sunset-sippers' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Sunset Sippers Perth - Best Golden Hour Pubs</h1>
        <p>Watch the sun go down with a cold pint at Perth&apos;s best sunset venues. West-facing views, beer gardens, and rooftop bars with verified prices across Perth.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <SunsetSippersPage />
    </>
  )
}
