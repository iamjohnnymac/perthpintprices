import assert from 'node:assert/strict'
import test from 'node:test'
import { toIndexablePubSlugPairs, type PubSitemapRow } from '@/lib/supabase'
import { buildSitemapRouteSets, SITEMAP_FALLBACK_LAST_MODIFIED } from './sitemapData'

const NOW = new Date('2026-07-21T00:00:00.000Z')

function makeRow(slug: string, overrides: Partial<PubSitemapRow> = {}): PubSitemapRow {
  return {
    slug,
    suburb: 'Fremantle',
    price: 12,
    price_verified: true,
    last_verified: '2026-07-20T00:00:00.000Z',
    last_updated: null,
    updated_at: null,
    happy_hour: null,
    happy_hour_price: null,
    happy_hour_days: null,
    happy_hour_start: null,
    happy_hour_end: null,
    beer_type: null,
    vibe_tag: null,
    has_tab: false,
    kid_friendly: false,
    cozy_pub: false,
    sunset_spot: false,
    website: null,
    business_status: 'OPERATIONAL',
    ...overrides,
  }
}

test('the pub sitemap preserves every legitimate price state and excludes confirmed closures', () => {
  const slugPairs = toIndexablePubSlugPairs([
    makeRow('fresh'),
    makeRow('stale', { last_verified: '2026-01-01T00:00:00.000Z' }),
    makeRow('missing-price', { price: null, price_verified: false, last_verified: null }),
    makeRow('unverified', { price_verified: false }),
    makeRow('closed', { business_status: 'CLOSED_PERMANENTLY' }),
  ], NOW)
  const routes = buildSitemapRouteSets(slugPairs, [], [])
  const urls = new Set(routes.pubs.map(route => route.url))

  for (const slug of ['fresh', 'stale', 'missing-price', 'unverified']) {
    assert.equal(urls.has(`https://perthpintprices.com/fremantle/${slug}`), true, slug)
  }
  assert.equal(urls.has('https://perthpintprices.com/fremantle/closed'), false)
})

test('the suburb sitemap uses the shared legitimate-venue policy and includes the /suburbs hub', () => {
  const routes = buildSitemapRouteSets([], [], [
    { slug: 'zero-venues', pubCount: 0 },
    { slug: 'one-tbc-venue', pubCount: 1 },
  ])
  const urls = new Set(routes.suburbs.map(route => route.url))

  assert.equal(urls.has('https://perthpintprices.com/zero-venues'), false)
  assert.equal(urls.has('https://perthpintprices.com/one-tbc-venue'), true)
  assert.ok(routes.content.some(route => route.url === 'https://perthpintprices.com/suburbs'))
})

test('the content sitemap excludes redirect roots and editorial timestamps ignore pub writes', () => {
  const first = buildSitemapRouteSets([], [{ suburb: 'Fremantle', lastModified: '2026-06-01T00:00:00.000Z' }], [])
  const second = buildSitemapRouteSets([], [{ suburb: 'Fremantle', lastModified: '2026-07-21T00:00:00.000Z' }], [])
  const firstGuide = first.content.find(route => route.url.endsWith('/guides/beer-weather'))
  const secondGuide = second.content.find(route => route.url.endsWith('/guides/beer-weather'))

  assert.equal(first.content.some(route => /\/(guides|insights)$/.test(route.url)), false)
  assert.equal(firstGuide?.lastModified, secondGuide?.lastModified)
  assert.equal(firstGuide?.lastModified, '2026-06-28T21:07:09.000Z')
})

test('pub and suburb modified dates use their relevant source data and a documented fallback', () => {
  const pairs = toIndexablePubSlugPairs([makeRow('missing-date', { last_verified: null })], NOW)
  const routes = buildSitemapRouteSets(pairs, [
    { suburb: 'Fremantle', lastModified: '2026-07-20T00:00:00.000Z' },
    { suburb: 'Perth', lastModified: 'not-a-date' },
  ], [
    { slug: 'fremantle', pubCount: 1 },
    { slug: 'perth', pubCount: 1 },
  ])

  assert.equal(routes.pubs[0].lastModified, SITEMAP_FALLBACK_LAST_MODIFIED)
  assert.equal(routes.suburbs.find(route => route.url.endsWith('/fremantle'))?.lastModified, '2026-07-20T00:00:00.000Z')
  assert.equal(routes.suburbs.find(route => route.url.endsWith('/perth'))?.lastModified, '2026-07-20T00:00:00.000Z')
})

test('sitemap inventories contain no duplicate or private/redirect URLs', () => {
  const routes = buildSitemapRouteSets([], [], [])
  for (const inventory of [routes.content, routes.suburbs, routes.pubs]) {
    const urls = inventory.map(route => route.url)
    assert.equal(new Set(urls).size, urls.length)
    for (const url of urls) assert.doesNotMatch(url, /\/(admin|api|signal)(\/|$)|\/world-cup$|\/(guides|insights)$/)
  }
  assert.deepEqual(routes.index.map(entry => entry.url), [
    'https://perthpintprices.com/sitemap-content.xml',
    'https://perthpintprices.com/sitemap-suburbs.xml',
    'https://perthpintprices.com/sitemap-pubs.xml',
  ])
})
