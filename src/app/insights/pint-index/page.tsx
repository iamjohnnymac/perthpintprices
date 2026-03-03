import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintIndexPage from './PintIndexPage'

export const metadata: Metadata = {
  title: "Perth Pint Index™ — Live Beer Price Tracker | Arvo",
  description: "Track Perth's average pint price over time. The Perth Pint Index™ monitors beer pricing trends across 300+ venues with weekly snapshots.",
  alternates: { canonical: 'https://perthpintprices.com/insights/pint-index' },
  openGraph: {
    title: "Perth Pint Index™ — Live Beer Price Tracker | Arvo",
    description: "Track Perth's average pint price over time across 300+ venues.",
    url: 'https://perthpintprices.com/insights/pint-index',
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
        { name: 'Perth Pint Index™' },
      ]} />
      <PintIndexPage />
    </>
  )
}
