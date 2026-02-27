import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SunsetSippersPage from './SunsetSippersPage'

export const metadata: Metadata = {
  title: "Sunset Sippers Perth — Best Golden Hour Pubs | Arvo",
  description: "Find Perth's best sunset pubs. Watch the sun go down with a cold pint at venues with west-facing views, beer gardens, and rooftop bars.",
  alternates: { canonical: 'https://perthpintprices.com/guides/sunset-sippers' },
  openGraph: {
    title: "Sunset Sippers Perth — Best Golden Hour Pubs | Arvo",
    description: "Perth's best sunset pubs with west-facing views and beer gardens.",
    url: 'https://perthpintprices.com/guides/sunset-sippers',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Guides', url: 'https://perthpintprices.com/guides' },
        { name: 'Sunset Sippers' },
      ]} />
      <SunsetSippersPage />
    </>
  )
}
