import { NextResponse } from 'next/server'
import { getPubBySlug } from '@/lib/supabase'
import { pubUrl } from '@/lib/urls'

interface RouteContext {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

// Old pub URL redirect: /pub/{slug} -> /{suburb}/{slug}
export async function GET(request: Request, { params }: RouteContext) {
  const pub = await getPubBySlug(params.slug)

  // The /pub/* namespace is permanently retired in favour of /{suburb}/{slug}.
  // When the slug no longer maps to a pub (venue removed or re-slugged), return
  // 410 Gone — the precise status for a permanently-removed URL scheme. (Google
  // treats 404 and 410 identically for indexing, so this is a correctness choice,
  // not a crawl-speed optimisation.)
  if (!pub) {
    return new Response('Gone', { status: 410 })
  }

  const destination = new URL(pubUrl(pub), request.url)
  return NextResponse.redirect(destination, 301)
}
