import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// Old suburb URL redirect: /suburb/{slug} -> /{slug}
export async function GET(request: Request, props: RouteContext) {
  const params = await props.params
  const destination = new URL(`/${params.slug}`, request.url)
  return NextResponse.redirect(destination, 301)
}
