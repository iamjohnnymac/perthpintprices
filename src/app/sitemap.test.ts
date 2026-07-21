import assert from 'node:assert/strict'
import test from 'node:test'
import { toIndexablePubSlugPairs, type PubSitemapRow } from '@/lib/supabase'
import { getSitemapRouteSets } from './sitemap'

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

test('pub sitemap routes preserve every legitimate price state and exclude confirmed closures', () => {
  const rows = [
    makeRow('fresh'),
    makeRow('aging', { last_verified: '2026-06-01T00:00:00.000Z' }),
    makeRow('stale', { last_verified: '2026-01-01T00:00:00.000Z' }),
    makeRow('missing-date', { last_verified: null }),
    makeRow('missing-price', { price: null, price_verified: false, last_verified: null }),
    makeRow('unverified', { price_verified: false }),
    makeRow('closed', { business_status: 'CLOSED_PERMANENTLY' }),
  ]
  const slugPairs = toIndexablePubSlugPairs(rows, NOW)
  const routeSets = getSitemapRouteSets(slugPairs, [], [])
  const urls = new Set(routeSets.pubRoutes.map(route => route.url))

  for (const slug of ['fresh', 'aging', 'stale', 'missing-date', 'missing-price', 'unverified']) {
    assert.equal(urls.has(`https://perthpintprices.com/fremantle/${slug}`), true, slug)
  }
  assert.equal(urls.has('https://perthpintprices.com/fremantle/closed'), false)
})
