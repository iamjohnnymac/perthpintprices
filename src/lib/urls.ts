const BASE_URL = 'https://perthpintprices.com'

/**
 * Canonical suburb -> URL slug for every pub and suburb page on the site.
 * Lowercases, strips straight apostrophes, collapses any other non-alphanumeric
 * run to a single hyphen, then trims leading/trailing hyphens.
 *
 * This is the single source of truth for the site's live, Google-indexed URLs,
 * so its output is pinned byte-for-byte by urls.test.ts. It lives here (not in
 * supabase.ts) so this URL seam is a pure, dependency-free kernel; supabase.ts
 * imports and re-exports it for back-compat.
 */
export function toSuburbSlug(suburb: string): string {
  return suburb
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Build a relative pub URL: /{suburb-slug}/{pub-slug} */
export function pubUrl(pub: { slug: string; suburb: string }): string {
  return `/${toSuburbSlug(pub.suburb)}/${pub.slug}`
}

/** Build a relative suburb URL: /{suburb-slug}. Pass isSlug=true if the input is already a slug. */
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
