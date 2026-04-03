import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import BeerWeatherPage from './BeerWeatherPage'

export const metadata: Metadata = {
  title: "Beer Weather Perth | Perth Pint Prices",
  description: "What's the weather saying about your next pint? Live Perth weather matched to pub picks. Scorcher? Hit a beer garden. Rainy? Find a cozy corner.",
  alternates: { canonical: 'https://perthpintprices.com/guides/beer-weather' },
  openGraph: {
    title: "Beer Weather Perth | Perth Pint Prices",
    description: "Live Perth weather matched to the right pub for the day.",
    url: 'https://perthpintprices.com/guides/beer-weather',
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: 'https://perthpintprices.com/og-image.png', width: 1200, height: 630, alt: 'Beer Weather Perth | Perth Pint Prices' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Discover', url: 'https://perthpintprices.com/discover' },
        { name: 'Beer Weather', url: 'https://perthpintprices.com/guides/beer-weather' },
      ]} />
      <div className="sr-only" aria-hidden="true">
        <h1>Beer Weather Perth - Today&apos;s Best Pub Picks</h1>
        <p>Live Perth weather matched to pub recommendations. Find beer gardens for sunny days, cozy corners for rainy weather, and rooftop bars for warm evenings across Perth&apos;s best venues.</p>
        <a href="/">Home</a>
        <a href="/discover">Discover</a>
        <a href="/happy-hour">Happy Hours</a>
      </div>
      <BeerWeatherPage />
    </>
  )
}
