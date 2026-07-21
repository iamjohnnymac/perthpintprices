import { getSitemapRouteSets } from '@/lib/sitemapData'
import { sitemapIndexResponse } from '@/lib/sitemapXml'

export const revalidate = 3600

export async function GET() {
  return sitemapIndexResponse((await getSitemapRouteSets()).index)
}
