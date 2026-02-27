import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PuntAndPintsPage from './PuntAndPintsPage'

export const metadata: Metadata = {
  title: "Punt & Pints — Perth Pubs with TAB Facilities | Arvo",
  description: "Find Perth pubs with TAB facilities. Watch the races, place a bet, and enjoy a cold pint. All the TAB-equipped venues in Perth with verified prices.",
  alternates: { canonical: 'https://perthpintprices.com/guides/punt-and-pints' },
  openGraph: {
    title: "Punt & Pints — Perth Pubs with TAB | Arvo",
    description: "Perth pubs with TAB facilities. Watch the races with a cold pint.",
    url: 'https://perthpintprices.com/guides/punt-and-pints',
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
        { name: 'Punt & Pints' },
      ]} />
      <PuntAndPintsPage />
    </>
  )
}
