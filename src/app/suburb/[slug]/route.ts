import { NextResponse } from 'next/server'

interface RouteContext {
  params: { slug: string }
}

// Old suburb URL redirect: /suburb/{slug} -> /{slug}
export function GET(request: Request, { params }: RouteContext) {
  const destination = new URL(`/${params.slug}`, request.url)
  return NextResponse.redirect(destination, 301)
}
