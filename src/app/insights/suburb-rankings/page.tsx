import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import SuburbRankingsPage from './SuburbRankingsPage'

export const metadata: Metadata = {
  title: "Perth Suburb Pint Price Rankings — Cheapest Suburbs for Beer | Arvo",
  description: "Compare pint prices across every Perth suburb. Find the cheapest suburbs for a beer, from Fremantle to Joondalup. Ranked by average pint price.",
  alternates: { canonical: 'https://perthpintprices.com/insights/suburb-rankings' },
  openGraph: {
    title: "Perth Suburb Pint Price Rankings | Arvo",
    description: "Compare pint prices across every Perth suburb. Find the cheapest areas for a beer.",
    url: 'https://perthpintprices.com/insights/suburb-rankings',
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
        { name: 'Suburb Rankings' },
      ]} />
      <SuburbRankingsPage />
    </>
  )
}
