import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SunsetSippersPage from './SunsetSippersPage'

export const metadata: Metadata = {
  title: "Sunset Sippers Perth: Best Golden Hour Pubs | Arvo",
  description: "Find Perth's best sunset pubs. Watch the sun go down with a cold pint at venues with west-facing views and beer gardens.",
  alternates: { canonical: 'https://perthpintprices.com/guides/sunset-sippers' },
  openGraph: {
    title: "Sunset Sippers Perth: Best Golden Hour Pubs | Arvo",
    description: "Perth's best sunset pubs with west-facing views and beer gardens.",
    url: 'https://perthpintprices.com/guides/sunset-sippers',
    type: 'website',
    siteName: 'Arvo',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Sunset Sippers Perth - Best Golden Hour Pubs | Arvo' }],
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
