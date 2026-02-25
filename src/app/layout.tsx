import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, DM_Serif_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Providers from './Providers'
import { getSiteStats } from '@/lib/supabase'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta', weight: ['300', '400', '500', '600', '700', '800'] })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-dm-serif' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats()
  const desc = `Perth's pint prices, sorted. Real prices from real people across ${stats.venueCount}+ venues and ${stats.suburbCount} suburbs.`
  const ogDesc = `Perth's pint prices, sorted. ${stats.venueCount}+ venues. Avg: $${stats.avgPrice}. Cheapest: $${stats.cheapestPrice}.`

  return {
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    title: "Arvo — Perth's pint prices, sorted.",
    description: desc,
    keywords: 'Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks, Arvo',
    openGraph: {
      title: "Arvo — Perth's pint prices, sorted.",
      description: ogDesc,
      url: 'https://arvo.pub',
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "Arvo — Perth's pint prices, sorted.",
      description: `Perth's pint prices, sorted. ${stats.venueCount}+ venues — find cheap pints near you.`,
    },
  }
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
        <meta name="theme-color" content="#E8820C" />
      </head>
      <body className={`${plusJakarta.variable} ${dmSerif.variable} ${jetbrainsMono.variable} ${plusJakarta.className}`}><Providers>{children}</Providers><Analytics /></body>
    </html>
  )
}
