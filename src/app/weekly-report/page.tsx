import { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import WeeklyClient from './WeeklyReportClient'

export const metadata: Metadata = {
  title: 'This Week in Perth Pints | Arvo',
  description: 'Weekly roundup of Perth beer prices. Track price movements, discover the cheapest pints this week, and see which venues are trending across Perth suburbs.',
  alternates: { canonical: 'https://perthpintprices.com/weekly' },
  openGraph: {
    title: 'This Week in Perth Pints | Arvo',
    description: 'Weekly roundup of Perth beer prices. Track price movements, discover the cheapest pints, and see trending venues.',
    url: 'https://perthpintprices.com/weekly',
    type: 'website',
    siteName: 'Arvo',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Perth pint price weekly report | Arvo' }],
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 3600

export default function WeeklyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Weekly Report', url: 'https://perthpintprices.com/weekly' },
      ]} />
      <WeeklyClient />
    </>
  )
}
