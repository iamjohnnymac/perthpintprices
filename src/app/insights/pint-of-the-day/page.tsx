import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import PintOfTheDayPage from './PintOfTheDayPage'

export const metadata: Metadata = {
  title: "Perth Pint of the Day — Today's Best Value Beer | Arvo",
  description: "Today's best value pint in Perth, algorithmically picked from 300+ venues. Updated daily with verified prices from real pub-goers.",
  alternates: { canonical: 'https://www.perthpintprices.com/insights/pint-of-the-day' },
  openGraph: {
    title: "Perth Pint of the Day | Arvo",
    description: "Today's best value pint in Perth, picked from 300+ venues.",
    url: 'https://www.perthpintprices.com/insights/pint-of-the-day',
    type: 'website',
    siteName: 'Arvo',
  },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://www.perthpintprices.com' },
        { name: 'Insights', url: 'https://www.perthpintprices.com/insights' },
        { name: 'Pint of the Day' },
      ]} />
      <PintOfTheDayPage />
    </>
  )
}
