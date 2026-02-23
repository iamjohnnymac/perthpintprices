import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPubBySlug, getAllPubSlugs, getNearbyPubs } from '@/lib/supabase'
import PubDetailClient from './PubDetailClient'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pub = await getPubBySlug(params.slug)
  if (!pub) return { title: 'Pub Not Found — PintDex' }
  
  const priceText = pub.price !== null ? `$${pub.price.toFixed(2)} pints` : 'Price TBC'
  const title = `${pub.name}, ${pub.suburb} — ${priceText} | PintDex`
  const description = `${priceText} at ${pub.name} in ${pub.suburb}, Perth WA.${pub.happyHour ? ` Happy Hour: ${pub.happyHour}.` : ''} ${pub.beerType ? `Serving ${pub.beerType}.` : ''} Find the best pint prices on PintDex.`
  
  return {
    title,
    description,
    openGraph: {
      title: `${pub.name} — ${priceText}`,
      description,
      url: `https://perthpintprices.vercel.app/pub/${params.slug}`,
      siteName: 'PintDex',
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

export const revalidate = 300 // Revalidate every 5 minutes

export default async function PubPage({ params }: PageProps) {
  const pub = await getPubBySlug(params.slug)
  if (!pub) notFound()
  
  const nearbyPubs = await getNearbyPubs(pub.suburb, pub.id, 4)
  
  return <PubDetailClient pub={pub} nearbyPubs={nearbyPubs} />
}
