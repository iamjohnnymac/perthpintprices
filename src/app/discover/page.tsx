import { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import DiscoverClient from './DiscoverClient'

export const metadata: Metadata = {
  title: 'Discover: Perth Pint Guides, Stats & Pub Picks | Arvo',
  description: 'Live pint data, suburb rankings, sunset spots, dad bars, and more. Everything beyond the price table.',
  alternates: {
    canonical: 'https://perthpintprices.com/discover',
  },
  openGraph: {
    title: 'Discover: Perth Pint Guides, Stats & Pub Picks | Arvo',
    description: 'Live pint data, suburb rankings, sunset spots, dad bars, and more.',
    url: 'https://perthpintprices.com/discover',
    siteName: 'Arvo',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: 'https://perthpintprices.com/og-image.png',
        width: 1200,
        height: 630,
        alt: "Discover Perth's best pints. Guides, stats & pub picks",
      },
    ],
  },
}

export default function DiscoverPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover' },
      ]} />
      <DiscoverClient />
    </>
  )
}
