import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSuburbs, getSuburbBySlug, getSuburbPubs, getNearbySuburbs, getSiteStats } from '@/lib/supabase'
import { getSuburbStory } from '@/lib/suburbStory'
import { absoluteSuburbUrl } from '@/lib/urls'
import SuburbClient from './SuburbClient'

interface PageProps {
  params: { suburb: string }
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
  return topSlugs.map(suburb => ({ suburb }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const suburb = await getSuburbBySlug(params.suburb)
  if (!suburb) return { title: 'Suburb Not Found' }

  const priceText = suburb.cheapestPrice !== 'TBC'
    ? `${suburb.pubCount} Pubs from $${suburb.cheapestPrice}`
    : `${suburb.pubCount} Pubs`
  const title = `Cheapest Pints in ${suburb.name}: ${priceText}`

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
      canonical: absoluteSuburbUrl(params.suburb),
    },
    openGraph: {
      title: `${title} | Perth Pint Prices`,
      description,
      url: absoluteSuburbUrl(params.suburb),
      siteName: 'Perth Pint Prices',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `Pint prices in ${suburb.name} | Perth Pint Prices` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Perth Pint Prices`,
      description,
    },
  }
}

export const revalidate = 300

export default async function SuburbPage({ params }: PageProps) {
  const suburb = await getSuburbBySlug(params.suburb)
  if (!suburb) notFound()

  const [pubs, nearbySuburbs, siteStats] = await Promise.all([
    getSuburbPubs(suburb.name),
    getNearbySuburbs(suburb.name, 5),
    getSiteStats(),
  ])
  const perthAvgPrice = Number(siteStats.avgPrice)
  const suburbStory = getSuburbStory({
    suburb,
    pubs,
    nearbySuburbs,
    perthAvgPrice,
    suburbSlug: params.suburb,
  })

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://perthpintprices.com' },
        { '@type': 'ListItem', position: 2, name: suburb.name, item: absoluteSuburbUrl(params.suburb) },
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
        url: `https://perthpintprices.com/${params.suburb}/${pub.slug}`,
      })),
    },
    ...(suburbStory.faqs.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: suburbStory.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }] : []),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Server-rendered links for crawlers — ensures ALL pubs are discoverable
          (SuburbClient only shows first 10 behind a "Show all" button) */}
      <div className="sr-only" aria-hidden="true">
        <h2>Cheapest Pints in {suburb.name}, Perth</h2>
        <p>Compare pint prices across {pubs.length} pubs in {suburb.name}. Community-verified prices updated daily.</p>
        <h2>All Pubs in {suburb.name}</h2>
        {pubs.map(pub => (
          <a key={pub.slug} href={`/${params.suburb}/${pub.slug}`}>
            {pub.name} - {pub.suburb}{pub.price ? ` - $${pub.price.toFixed(2)}` : ''}
          </a>
        ))}
        <h2>Nearby Suburbs</h2>
        {nearbySuburbs.map(ns => (
          <a key={ns.slug} href={`/${ns.slug}`}>{ns.name}</a>
        ))}
        <a href="/">Home</a>
        <a href="/suburbs">All Suburbs</a>
      </div>

      <SuburbClient
        suburb={suburb}
        pubs={pubs}
        nearbySuburbs={nearbySuburbs}
        perthAvgPrice={perthAvgPrice}
        suburbSlug={params.suburb}
      />
    </>
  )
}
