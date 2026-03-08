import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
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
    metadataBase: new URL('https://perthpintprices.com'),
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    title: "Arvo | Perth's pint prices, sorted.",
    description: desc,
    keywords: 'Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks, Arvo',
    openGraph: {
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: "Arvo | Perth's pint prices, sorted",
        },
      ],
      title: "Arvo | Perth's pint prices, sorted.",
      description: ogDesc,
      url: 'https://perthpintprices.com',
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "Arvo | Perth's pint prices, sorted.",
      description: `Perth's pint prices, sorted. ${stats.venueCount}+ venues. Find cheap pints near you.`,
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
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1WN68Q85SY" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1WN68Q85SY');
          `}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8820C" />
      </head>
      <body className={`${plusJakarta.variable} ${dmSerif.variable} ${jetbrainsMono.variable} ${plusJakarta.className}`}><div className="h-[5px] bg-amber w-full" /><Providers>{children}</Providers><Analytics /></body>
    </html>
  )
}
