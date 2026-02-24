import type { Metadata } from 'next'
import HappyHourClient from './HappyHourClient'

export const metadata: Metadata = {
  title: 'Happy Hours Live Now in Perth | Arvo',
  description:
    'See which Perth pubs have happy hour deals running right now. Live countdown timers, savings calculations, and the cheapest pints available today.',
  openGraph: {
    title: 'Happy Hours Live Now in Perth | Arvo',
    description:
      'See which Perth pubs have happy hour deals running right now. Live countdown timers and the cheapest pints available today.',
  },
}

export default function HappyHourPage() {
  return <HappyHourClient />
}
