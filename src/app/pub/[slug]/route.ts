import { NextResponse } from 'next/server'
import { getPubBySlug, toSuburbSlug } from '@/lib/supabase'

interface RouteContext {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

// Old pub URL redirect: /pub/{slug} -> /{suburb}/{slug}
export async function GET(request: Request, { params }: RouteContext) {
  const pub = await getPubBySlug(params.slug)

  if (!pub) {
    return new Response('Not found', { status: 404 })
  }

  const destination = new URL(`/${toSuburbSlug(pub.suburb)}/${pub.slug}`, request.url)
  return NextResponse.redirect(destination, 301)
}
