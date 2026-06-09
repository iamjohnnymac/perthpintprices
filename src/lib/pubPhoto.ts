import type { Pub } from '@/types/pub'

// Helpers for keeping pub photos + pub list payloads light.

// ── Photo sizing ───────────────────────────────────────────────────────────
// Google Place photos are hotlinked from lh3.googleusercontent.com. We must keep
// them hotlinked (Google's terms forbid re-hosting/caching them on our own CDN),
// so we can't run them through next/image — instead we tune the size token in the
// URL and ship a display-sized variant.

const GOOGLE_PHOTO_HOST = 'googleusercontent.com'

// Default display width. Pub photos render in a column capped at ~752px wide and
// are height-cropped (object-cover), so 640px stays crisp while landing each photo
// at ~90KB instead of the ~200KB+ a full-size request returns — under Googlebot /
// Ahrefs' 100KB "image too large" threshold.
const DEFAULT_WIDTH = 640

/**
 * Request a display-sized variant of a Google Place photo.
 *
 * lh3.googleusercontent.com photos carry a trailing size token after `=`
 * (e.g. `=s4800-w1024`); we swap it for `=w<width>`, or append one if absent.
 * The URL stays pointed at Google, so this is safe to apply at render time.
 * Non-Google URLs (manually supplied shots) and empty values pass through
 * untouched.
 */
export function resizeGooglePhoto(
  url: string | null | undefined,
  width: number = DEFAULT_WIDTH,
): string | null | undefined {
  if (!url || !url.includes(GOOGLE_PHOTO_HOST)) return url
  // Stored Place photos carry the size token in the path and never a query
  // string; bail on any `?`-bearing URL so we never mangle a query param.
  if (url.includes('?')) return url
  // The size token is a trailing `=...` segment with no slash; replace it,
  // otherwise append one.
  return /=[^/=]+$/.test(url)
    ? url.replace(/=[^/=]+$/, `=w${width}`)
    : `${url}=w${width}`
}

// ── List payload slimming ────────────────────────────────────────────────────
// Pub lists (homepage, suburb pages) serialise every pub into the page's HTML.
// The Google Places enrichment below is never shown in a list/card — only on the
// individual pub page and the happy-hour listicle — so shipping it across ~850
// pubs just bloats the payload (the homepage hit ~2.1MB, past Googlebot's 2MB
// crawl limit). Every field here is optional on `Pub`, so dropping it leaves a
// value that's still assignable to `Pub` (consumers already treat these as
// "unknown"). Pages that DO render this data must use the full pub — and note
// that anything computed from a slimmed array, including client-side (e.g.
// SuburbClient re-deriving its suburb story), must never read a field listed
// here.
const LIST_OMITTED_FIELDS = [
  'googlePhotoUrl',
  'googlePhotoAttribution',
  'googlePhotoAttributionUri',
  'googleEditorialSummary',
  'googleOpeningHours',
  'servesBeer',
  'servesFood',
  'outdoorSeating',
  'goodForChildren',
  'goodForGroups',
  'goodForWatchingSports',
  'allowsDogs',
  'liveMusic',
  'restroom',
  'reservable',
  'googleRating',
  'googleRatingCount',
  'googlePriceLevel',
  'businessStatus',
  'googleAttrsUpdatedAt',
] as const satisfies readonly (keyof Pub)[]

export type SlimPub = Omit<Pub, (typeof LIST_OMITTED_FIELDS)[number]>

/**
 * Drop the heavy, list-irrelevant Google enrichment from a pub before it's
 * serialised into a list page's HTML. See LIST_OMITTED_FIELDS for the rationale.
 */
export function slimPubForList(pub: Pub): SlimPub {
  const trimmed: Partial<Pub> = { ...pub }
  for (const field of LIST_OMITTED_FIELDS) delete trimmed[field]
  return trimmed as SlimPub
}
