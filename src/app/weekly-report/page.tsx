import { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import WeeklyClient from './WeeklyReportClient'

export const metadata: Metadata = {
  title: 'This Week in Perth Pints | Arvo',
  description: 'Weekly roundup of Perth beer prices. Price movements, cheapest pints, and trending venues.',
  alternates: { canonical: 'https://perthpintprices.com/weekly' },
  openGraph: {
    title: 'This Week in Perth Pints | Arvo',
    description: 'Weekly roundup of Perth beer prices. Drops, deals, and trends.',
    url: 'https://perthpintprices.com/weekly',
    type: 'website',
    siteName: 'Arvo',
  }
}

export const revalidate = 3600

export default function WeeklyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Weekly Report' },
      ]} />
      <WeeklyClient />
    </>
  )
}
