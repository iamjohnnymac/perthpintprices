import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildOrganizationJsonLd,
  buildSiteJsonLdGraph,
  buildWebSiteJsonLd,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from './siteJsonLd'

test('buildOrganizationJsonLd emits a complete brand entity', () => {
  const org = buildOrganizationJsonLd()

  assert.equal(org['@type'], 'Organization')
  assert.equal(org['@id'], ORGANIZATION_ID)
  assert.equal(org['@id'], 'https://perthpintprices.com/#organization')
  assert.equal(org.name, 'Perth Pint Prices')

  // No @context — this node is embedded in a page-level @graph.
  assert.equal('@context' in org, false)

  // Logo must be the square brand mark, not the landscape OG image.
  const logo = org.logo as Record<string, unknown>
  assert.equal(logo['@type'], 'ImageObject')
  assert.equal(logo.url, 'https://perthpintprices.com/logo.png')
  assert.equal(logo.width, 1024)
  assert.equal(logo.height, 1024)

  // sameAs must list real, linked brand profiles.
  assert.ok(Array.isArray(org.sameAs))
  const sameAs = org.sameAs as string[]
  assert.ok(sameAs.includes('https://facebook.com/arvopints'))
  assert.ok(sameAs.includes('https://instagram.com/arvopints'))
  assert.ok(sameAs.includes('https://tiktok.com/@arvopints'))
  assert.ok(sameAs.includes('https://x.com/arvopints'))
  assert.ok(sameAs.every(url => url.startsWith('https://')))
})

test('buildWebSiteJsonLd links to the Organization as publisher', () => {
  const site = buildWebSiteJsonLd()

  assert.equal(site['@type'], 'WebSite')
  assert.equal(site['@id'], WEBSITE_ID)
  assert.equal('@context' in site, false)
  assert.equal(site.url, 'https://perthpintprices.com')
  assert.deepEqual(site.publisher, { '@id': ORGANIZATION_ID })
  assert.equal(site.inLanguage, 'en-AU')
})

test('buildSiteJsonLdGraph emits the reusable site-level graph', () => {
  const graph = buildSiteJsonLdGraph()
  const nodes = graph['@graph'] as Record<string, unknown>[]

  assert.equal(graph['@context'], 'https://schema.org')
  assert.equal(nodes.length, 2)
  assert.equal(nodes[0]['@id'], ORGANIZATION_ID)
  assert.equal(nodes[1]['@id'], WEBSITE_ID)
})
