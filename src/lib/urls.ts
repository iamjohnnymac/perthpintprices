import { toSuburbSlug } from './supabase'

const BASE_URL = 'https://perthpintprices.com'

/** Build a relative pub URL: /{suburb-slug}/{pub-slug} */
export function pubUrl(pub: { slug: string; suburb: string }): string {
  return `/${toSuburbSlug(pub.suburb)}/${pub.slug}`
}

/** Build a relative suburb URL: /{suburb-slug} */
export function suburbUrl(suburbSlugOrName: string, isSlug = false): string {
  return `/${isSlug ? suburbSlugOrName : toSuburbSlug(suburbSlugOrName)}`
}

/** Build an absolute pub URL for canonicals, OG, and structured data */
export function absolutePubUrl(pub: { slug: string; suburb: string }): string {
  return `${BASE_URL}${pubUrl(pub)}`
}

/** Build an absolute suburb URL for canonicals, OG, and structured data */
export function absoluteSuburbUrl(slug: string): string {
  return `${BASE_URL}/${slug}`
}
