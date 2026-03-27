import { permanentRedirect } from 'next/navigation'

interface PageProps {
  params: { slug: string }
}

// Old suburb URL redirect: /suburb/{slug} → /{slug}
// Keeps SEO equity flowing to new URLs via 308 permanent redirect
export default function OldSuburbPage({ params }: PageProps) {
  permanentRedirect(`/${params.slug}`)
}
