import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import AiPriceDemo from './AiPriceDemo'

export const metadata: Metadata = {
  title: 'Andrew Illustrative Price Check',
  description: 'Hear Andrew and step through a fictional price check from voice sample to structured review fields.',
  alternates: { canonical: '/ai-price-demo' },
  openGraph: {
    title: 'Andrew Illustrative Price Check | Perth Pint Prices',
    description: 'Hear Andrew and step through a fictional voice-to-review price check.',
    url: '/ai-price-demo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andrew Illustrative Price Check | Perth Pint Prices',
    description: 'Hear Andrew and step through a fictional voice-to-review price check.',
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
