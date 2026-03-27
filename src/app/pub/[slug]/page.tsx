import { permanentRedirect, notFound } from 'next/navigation'
import { getPubBySlug, toSuburbSlug } from '@/lib/supabase'

interface PageProps {
  params: { slug: string }
}

// Old pub URL redirect: /pub/{slug} → /{suburb}/{slug}
// Keeps SEO equity flowing to new URLs via 308 permanent redirect
export default async function OldPubPage({ params }: PageProps) {
  const pub = await getPubBySlug(params.slug)
  if (!pub) notFound()
  permanentRedirect(`/${toSuburbSlug(pub.suburb)}/${pub.slug}`)
}
