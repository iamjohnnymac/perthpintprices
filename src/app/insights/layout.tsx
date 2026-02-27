import { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'

export const metadata: Metadata = {
  title: 'Insights — Perth Pint Price Data & Market Trends | Arvo',
  description: 'Live Perth pint price index, suburb rankings, venue analysis, and beer market trends. Track how beer prices change across 300+ venues.',
  alternates: { canonical: 'https://perthpintprices.com/insights' },
  openGraph: {
    title: 'Perth Pint Price Insights | Arvo',
    description: 'Live Perth pint price index, suburb rankings, and market trends.',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
