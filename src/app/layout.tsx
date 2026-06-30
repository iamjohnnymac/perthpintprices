import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Plus_Jakarta_Sans, DM_Serif_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Providers from './Providers'
import JsonLdScript from '@/components/JsonLdScript'
import { buildSiteJsonLdGraph } from '@/lib/siteJsonLd'
import { getSiteStats } from '@/lib/supabase'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta', weight: ['300', '400', '500', '600', '700', '800'], display: 'swap' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-dm-serif', display: 'swap' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getSiteStats()
  const desc = `What a pint costs across ${stats.venueCount} Perth pubs — checked, dated, and sorted cheapest first.`
  const ogDesc = `${stats.venueCount} Perth pubs, sorted cheapest first. Average $${stats.avgPrice}, cheapest $${stats.cheapestPrice} — each price dated.`

  return {
    metadataBase: new URL('https://perthpintprices.com'),
    applicationName: 'Perth Pint Prices',
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    title: {
      default: "Perth Pint Prices | Perth's pints, sorted.",
      template: '%s | Perth Pint Prices',
    },
    description: desc,
    keywords: 'Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks, Perth Pint Prices',
    openGraph: {
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: "Perth Pint Prices | Perth's pints, sorted",
        },
      ],
      title: "Perth Pint Prices | Perth's pints, sorted.",
      description: ogDesc,
      url: 'https://perthpintprices.com',
      siteName: 'Perth Pint Prices',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "Perth Pint Prices | Perth's pints, sorted.",
      description: `What a pint costs across ${stats.venueCount} Perth pubs — checked and sorted cheapest first.`,
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
        {/* Google Analytics — loaded on idle so the 160 KB gtag bundle stays
            off the critical path (PageSpeed flagged it as unused JS on load). */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1WN68Q85SY" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1WN68Q85SY');
          `}
        </Script>
        {/* Microsoft Clarity — session recordings + heatmaps. Lazy-loaded to
            match GA and keep the tag off the critical path. */}
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xez4co2ysd");
          `}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FDF8F0" />
        <JsonLdScript data={buildSiteJsonLdGraph()} />
      </head>
      <body className={`${plusJakarta.variable} ${dmSerif.variable} ${jetbrainsMono.variable} ${plusJakarta.className}`}><div className="h-[5px] bg-amber w-full" /><Providers>{children}</Providers><Analytics /></body>
    </html>
  )
}
