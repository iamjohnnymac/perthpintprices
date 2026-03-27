import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPubBySlug, getAllPubSlugPairs, getNearbyPubs, getSimilarPricePubs, getSiteStats, toSuburbSlug } from '@/lib/supabase'
import { absolutePubUrl, absoluteSuburbUrl } from '@/lib/urls'
import PubDetailClient from './PubDetailClient'

interface PageProps {
  params: { suburb: string; pub: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pub = await getPubBySlug(params.pub)
  if (!pub) return { title: 'Pub Not Found | Arvo' }

  const priceText = pub.price !== null ? `$${pub.price.toFixed(2)} pints` : 'Price TBC'
  const title = `${pub.name}, ${pub.suburb}: ${priceText} | Arvo`

  // Build description with progressive enrichment (target 70-160 chars)
  const descParts: string[] = []
  descParts.push(`Compare pint prices at ${pub.name} in ${pub.suburb}, Perth WA.`)
  if (pub.price !== null) descParts.push(`Standard pint from $${pub.price.toFixed(2)}.`)
  if (pub.happyHour) descParts.push(`Happy hour: ${pub.happyHour}.`)
  if (pub.vibeTag) descParts.push(`${pub.vibeTag} venue.`)
  if (pub.beerType) descParts.push(`Serving ${pub.beerType}.`)
  descParts.push('Community-verified prices updated daily on Arvo.')
  let description = descParts.join(' ')
  if (description.length < 120) {
    description += ' Find cheaper pints nearby.'
  }
  if (description.length > 160) {
    // Truncate at last sentence boundary before 155 chars
    const truncated = description.slice(0, 155)
    const lastDot = truncated.lastIndexOf('.')
    description = lastDot > 80 ? truncated.slice(0, lastDot + 1) : truncated + '...'
  }

  const canonical = absolutePubUrl(pub)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${pub.name}: ${priceText}`,
      description,
      url: canonical,
      siteName: 'Arvo',
      locale: 'en_AU',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${pub.name} pint prices | Arvo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pub.name}: ${priceText}`,
      description,
    },
  }
}

export async function generateStaticParams() {
  const pairs = await getAllPubSlugPairs()
  return pairs.map(pair => ({ suburb: toSuburbSlug(pair.suburb), pub: pair.slug }))
}

export const revalidate = 300

export default async function PubPage({ params }: PageProps) {
  const pub = await getPubBySlug(params.pub)
  if (!pub) notFound()

  // Verify the suburb slug matches — redirect to correct URL if not
  const suburbSlug = toSuburbSlug(pub.suburb)
  if (suburbSlug !== params.suburb) {
    permanentRedirect(`/${suburbSlug}/${pub.slug}`)
  }

  const [nearbyPubs, similarPricePubs, stats] = await Promise.all([
    getNearbyPubs(pub.suburb, pub.id, 8),
    pub.price != null ? getSimilarPricePubs(pub.price, pub.suburb, pub.id, 6) : Promise.resolve([]),
    getSiteStats(),
  ])

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://perthpintprices.com' },
        { '@type': 'ListItem', position: 2, name: pub.suburb, item: `https://perthpintprices.com/${suburbSlug}` },
        { '@type': 'ListItem', position: 3, name: pub.name, item: `https://perthpintprices.com/${suburbSlug}/${pub.slug}` },
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

      {/* Server-rendered links for crawlers — ensures this pub page has strong internal linking */}
      <div className="sr-only" aria-hidden="true">
        <a href="/">Home</a>
        <a href={`/${suburbSlug}`}>{pub.suburb}</a>
        <a href="/suburbs">All Suburbs</a>
        {nearbyPubs.map(np => (
          <a key={np.slug} href={`/${suburbSlug}/${np.slug}`}>{np.name} - {np.suburb}</a>
        ))}
        {similarPricePubs.map(sp => (
          <a key={sp.slug} href={`/${toSuburbSlug(sp.suburb)}/${sp.slug}`}>{sp.name} - {sp.suburb}</a>
        ))}
      </div>

      <PubDetailClient pub={pub} nearbyPubs={nearbyPubs} similarPricePubs={similarPricePubs} avgPrice={Number(stats.avgPrice)} />
    </>
  )
}
