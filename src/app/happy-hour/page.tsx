import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import HappyHourClient from './HappyHourClient'

export const metadata: Metadata = {
  title: 'Happy Hours in Perth Right Now | Arvo',
  description:
    'Which Perth pubs have happy hour deals on right now. Live countdown timers, savings calculations, and the cheapest pints available today.',
  alternates: { canonical: 'https://perthpintprices.com/happy-hour' },
  openGraph: {
    title: 'Happy Hours Live Now in Perth | Arvo',
    description:
      'See which Perth pubs have happy hour deals running right now. Live countdown timers and the cheapest pints available today.',
    url: 'https://perthpintprices.com/happy-hour',
    type: 'website',
    siteName: 'Arvo',
  },
  twitter: { card: 'summary_large_image' },
}

export default function HappyHourPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Happy Hour' },
      ]} />
      <HappyHourClient />
    </>
  )
}
