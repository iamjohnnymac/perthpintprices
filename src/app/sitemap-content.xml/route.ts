import { getSitemapRouteSets } from '@/lib/sitemapData'
import { urlSetResponse } from '@/lib/sitemapXml'

export const revalidate = 3600

export async function GET() {
  return urlSetResponse((await getSitemapRouteSets()).content)
}
