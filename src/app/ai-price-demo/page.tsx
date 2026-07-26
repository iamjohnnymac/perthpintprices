import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import AiPriceDemo from './AiPriceDemo'

export const metadata: Metadata = {
  title: 'Andrew AI Price Checks',
  description: 'See how Andrew turns a short pub call into a structured pint-price update ready for review.',
  alternates: { canonical: '/ai-price-demo' },
  openGraph: {
    title: 'Andrew AI Price Checks | Perth Pint Prices',
    description: 'See how a voice agent captures and validates a pint-price update from one short call.',
    url: '/ai-price-demo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andrew AI Price Checks | Perth Pint Prices',
    description: 'See how a voice agent captures and validates a pint-price update from one short call.',
  },
  robots: { index: false, follow: false },
}

export default function AiPriceDemoPage() {
  return (
    <>
      <AiPriceDemo />
      <Footer />
    </>
  )
}
