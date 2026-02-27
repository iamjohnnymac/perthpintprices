import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insights — Perth Pint Price Data | Arvo',
  description: 'Live Perth pint price index, suburb rankings, and market trends. Track how beer prices change across 200+ venues.',
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
