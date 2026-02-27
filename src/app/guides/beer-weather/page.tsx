import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import BeerWeatherPage from './BeerWeatherPage'

export const metadata: Metadata = {
  title: "Beer Weather Perth — Weather-Matched Pub Picks | Arvo",
  description: "What's the weather saying about your next pint? Get real-time Perth weather matched to the perfect pub. Scorcher? Hit a beer garden. Rainy? Find a cozy corner.",
  alternates: { canonical: 'https://perthpintprices.com/guides/beer-weather' },
  openGraph: {
    title: "Beer Weather Perth — Weather-Matched Pub Picks | Arvo",
    description: "Real-time Perth weather matched to the perfect pub pick.",
    url: 'https://perthpintprices.com/guides/beer-weather',
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
        { name: 'Beer Weather' },
      ]} />
      <BeerWeatherPage />
    </>
  )
}
