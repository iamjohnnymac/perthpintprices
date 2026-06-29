import { BASE_URL } from './urls'

// Stable @id anchors so the brand entity can be referenced across the graph
// (e.g. WebSite.publisher -> Organization). Google reads the canonical
// Organization for a domain from the homepage, so these nodes live there.
export const ORGANIZATION_ID = `${BASE_URL}/#organization`
export const WEBSITE_ID = `${BASE_URL}/#website`

const LOGO_ID = `${BASE_URL}/#logo`
const LOGO_URL = `${BASE_URL}/logo.png`

// Returns the Organization node WITHOUT an @context so it can be embedded in a
// page-level @graph. The logo is the square brand mark (not the landscape OG
// image) — Google uses it for the knowledge-panel / search branding.
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Perth Pint Prices',
    alternateName: 'Arvo',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: LOGO_URL,
      width: 1024,
      height: 1024,
      caption: 'Perth Pint Prices',
    },
    image: { '@id': LOGO_ID },
  }
}

// Returns the WebSite node (no @context — embed in a @graph). Linked to the
// Organization as its publisher so the two entities resolve to one brand.
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Perth Pint Prices',
    alternateName: 'Arvo',
    url: BASE_URL,
    description: "What a pint costs across Perth's pubs — checked, dated, and sorted cheapest first.",
    publisher: { '@id': ORGANIZATION_ID },
    inLanguage: 'en-AU',
  }
}

export function buildSiteJsonLdGraph(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
    ],
  }
}
