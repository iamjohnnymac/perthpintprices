import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  title: "PintDex — Perth's pint prices, sorted.",
  description: "Track real-time pint prices across 200+ Perth pubs and 90 suburbs. Find happy hours, cheap pints, and the best deals — Perth\'s beer price tracker.",
  keywords: 'Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks, PintDex',
  openGraph: {
    title: "PintDex — Perth's pint prices, sorted.",
    description: "Real-time pint prices across 200+ Perth pubs. Avg: $9.20. Cheapest: $6.00.",
    url: 'https://pintdex.com.au',
    siteName: 'PintDex',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PintDex — Perth's pint prices, sorted.",
    description: "Real-time pint prices across 200+ Perth pubs. Find cheap pints near you.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4A017" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.className} bg-cream`}>{children}<Analytics /></body>
    </html>
  )
}