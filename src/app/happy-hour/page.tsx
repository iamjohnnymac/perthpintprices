import type { Metadata } from 'next'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import HappyHourClient from './HappyHourClient'

export const metadata: Metadata = {
  title: 'Happy Hours Live Now in Perth — Cheapest Pints Right Now | Arvo',
  description:
    'See which Perth pubs have happy hour deals running right now. Live countdown timers, savings calculations, and the cheapest pints available today.',
  alternates: { canonical: 'https://perthpintprices.com/happy-hour' },
  openGraph: {
    title: 'Happy Hours Live Now in Perth | Arvo',
    description:
      'See which Perth pubs have happy hour deals running right now. Live countdown timers and the cheapest pints available today.',
    url: 'https://perthpintprices.com/happy-hour',
    type: 'website',
    siteName: 'Arvo',
  },
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
