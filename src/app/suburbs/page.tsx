import { Metadata } from 'next'
import { getAllSuburbs } from '@/lib/supabase'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SuburbsClient from './SuburbsClient'

export const metadata: Metadata = {
  title: 'All Suburbs',
  description: 'Browse pint prices across every Perth suburb. Compare average prices, find the cheapest pints near you, and discover happy hour deals. Community-verified prices updated daily.',
  alternates: { canonical: 'https://perthpintprices.com/suburbs' },
  openGraph: {
    title: 'All Suburbs | Perth Pint Prices',
    description: 'Browse pint prices across every Perth suburb. Compare average prices, find the cheapest pints near you, and discover happy hour deals.',
    url: 'https://perthpintprices.com/suburbs',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth suburb pint prices | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 300

export default async function SuburbsPage() {
  const suburbs = await getAllSuburbs()
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'All Suburbs', url: 'https://perthpintprices.com/suburbs' },
      ]} />
      <SuburbsClient suburbs={suburbs} />
    </>
  )
}
