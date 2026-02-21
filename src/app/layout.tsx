import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  title: "PintDex — Perth's Beer Market | Find Cheap Pints Near You",
  description: "Track real-time pint prices across 194 Perth pubs and 89 suburbs. Find happy hours, cheap pints, and the best deals — like a stock exchange for beer.",
  keywords: 'Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks, PintDex',
  openGraph: {
    title: "PintDex — Perth's Beer Market",
    description: "Real-time pint prices across 194 Perth pubs. Avg: $8.97. Cheapest: $6.00.",
    url: 'https://pintdex.com.au',
    siteName: 'PintDex',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PintDex — Perth's Beer Market",
    description: "Real-time pint prices across 194 Perth pubs. Find cheap pints near you.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.className} bg-cream`}>{children}</body>
    </html>
  )
}