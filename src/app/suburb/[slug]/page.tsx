import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSuburbs, getSuburbBySlug, getSuburbPubs, getNearbySuburbs, getSiteStats } from '@/lib/supabase'
import SuburbClient from './SuburbClient'

interface PageProps {
  params: { slug: string }
}

export const dynamicParams = true

export async function generateStaticParams() {
  // Pre-build only the top suburbs at build time for speed
  // All other suburb pages are generated on-demand and cached via ISR (revalidate = 300)
  const topSlugs = [
    'northbridge', 'fremantle', 'perth', 'subiaco', 'leederville',
    'mount-lawley', 'victoria-park', 'scarborough', 'joondalup', 'mandurah',
    'cottesloe', 'claremont', 'east-perth', 'south-perth', 'midland',
  ]
  return topSlugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const suburb = await getSuburbBySlug(params.slug)
  if (!suburb) return { title: 'Suburb Not Found | Arvo' }

  const priceText = suburb.cheapestPrice !== 'TBC'
    ? `${suburb.pubCount} Pubs from $${suburb.cheapestPrice}`
    : `${suburb.pubCount} Pubs`
  const title = `Cheapest Pints in ${suburb.name}: ${priceText} | Arvo`

  const descParts = [`Compare pint prices across ${suburb.pubCount} pubs in ${suburb.name}, Perth.`]
  if (suburb.cheapestPrice !== 'TBC') {
    descParts.push(`Cheapest pint: $${suburb.cheapestPrice} at ${suburb.cheapestPub}.`)
    descParts.push(`Average: $${suburb.avgPrice}.`)
  }
  descParts.push('Find the best deals near you.')
  const description = descParts.join(' ')

  return {
    title,
    description,
    alternates: {
      canonical: `https://perthpintprices.com/suburb/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://perthpintprices.com/suburb/${params.slug}`,
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `Pint prices in ${suburb.name} | Arvo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export const revalidate = 300

export default async function SuburbPage({ params }: PageProps) {
  const suburb = await getSuburbBySlug(params.slug)
  if (!suburb) notFound()

  const [pubs, nearbySuburbs, siteStats] = await Promise.all([
    getSuburbPubs(suburb.name),
    getNearbySuburbs(suburb.name, 5),
    getSiteStats(),
  ])

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://perthpintprices.com' },
        { '@type': 'ListItem', position: 2, name: suburb.name },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Pubs in ${suburb.name}`,
      description: `Pubs ranked by cheapest pint price in ${suburb.name}, Perth`,
      numberOfItems: pubs.length,
      itemListElement: pubs.map((pub, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: pub.name,
        url: `https://perthpintprices.com/pub/${pub.slug}`,
      })),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SuburbClient
        suburb={suburb}
        pubs={pubs}
        nearbySuburbs={nearbySuburbs}
        perthAvgPrice={Number(siteStats.avgPrice)}
      />
    </>
  )
}
