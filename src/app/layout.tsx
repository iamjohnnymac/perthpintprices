import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Perth Pint Prices | Find Cheap Beers Near You',
  description: 'Discover the best pint prices at pubs across Perth, Western Australia. Find happy hours, compare prices, and never overpay for a beer again.',
  keywords: 'Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks',
  openGraph: {
    title: 'Perth Pint Prices',
    description: 'Find the cheapest pints in Perth',
    url: 'https://perthpintprices.com',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}