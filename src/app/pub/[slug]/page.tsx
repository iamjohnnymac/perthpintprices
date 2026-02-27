import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPubBySlug, getAllPubSlugs, getNearbyPubs, getSiteStats } from '@/lib/supabase'
import PubDetailClient from './PubDetailClient'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pub = await getPubBySlug(params.slug)
  if (!pub) return { title: 'Pub Not Found — Arvo' }
  
  const priceText = pub.price !== null ? `$${pub.price.toFixed(2)} pints` : 'Price TBC'
  const title = `${pub.name}, ${pub.suburb} — ${priceText} | Arvo`
  const description = `${priceText} at ${pub.name} in ${pub.suburb}, Perth WA.${pub.happyHour ? ` Happy Hour: ${pub.happyHour}.` : ''} ${pub.beerType ? `Serving ${pub.beerType}.` : ''} Find the best pint prices on Arvo.`
  
  return {
    title,
    description,
    alternates: { canonical: `https://perthpintprices.com/pub/${params.slug}` },
    openGraph: {
      title: `${pub.name} — ${priceText}`,
      description,
      url: `https://perthpintprices.com/pub/${params.slug}`,
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${pub.name} — ${priceText}`,
      description,
    },
  }
}

export async function generateStaticParams() {
  const slugs = await getAllPubSlugs()
  return slugs.map(slug => ({ slug }))
}

export const revalidate = 300

export default async function PubPage({ params }: PageProps) {
  const pub = await getPubBySlug(params.slug)
  if (!pub) notFound()
  
  const [nearbyPubs, stats] = await Promise.all([
    getNearbyPubs(pub.suburb, pub.id, 4),
    getSiteStats(),
  ])
  
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://perthpintprices.com' },
        { '@type': 'ListItem', position: 2, name: pub.suburb, item: `https://perthpintprices.com/?suburb=${encodeURIComponent(pub.suburb)}` },
        { '@type': 'ListItem', position: 3, name: pub.name },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BarOrPub',
      name: pub.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: pub.address,
        addressLocality: pub.suburb,
        addressRegion: 'WA',
        addressCountry: 'AU',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: pub.lat,
        longitude: pub.lng,
      },
      ...(pub.website ? { url: pub.website } : {}),
      ...(pub.price ? {
        priceRange: `$${pub.price.toFixed(2)} per pint`,
      } : {}),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PubDetailClient pub={pub} nearbyPubs={nearbyPubs} avgPrice={Number(stats.avgPrice)} />
    </>
  )
}
