import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DISCOVER_BEST_BUYS_HREF,
  DISCOVER_DATA_TOOL_LINKS,
  getPubContextLinks,
  isCanonicalPubLinkEligible,
  SUBURB_CONTEXT_LINKS,
} from './internalLinks'

test('Discover links every priority data tool at its canonical route', () => {
  assert.deepEqual(
    DISCOVER_DATA_TOOL_LINKS.map(link => link.href),
    [
      '/insights/pint-index',
      '/insights/pint-of-the-day',
      '/insights/tonights-best-bets',
      '/insights/suburb-rankings',
      '/insights/venue-breakdown',
    ],
  )
  assert.equal(DISCOVER_BEST_BUYS_HREF, '/cheapest-pints')
})

test('pub and suburb rails use descriptive canonical destinations', () => {
  assert.deepEqual(getPubContextLinks({ suburb: 'East Fremantle' }), [
    { href: '/east-fremantle', label: 'All East Fremantle pub prices' },
    { href: '/cheapest-pints', label: "Perth's cheapest pints" },
    { href: '/happy-hour', label: 'Happy hours across Perth' },
  ])
  assert.deepEqual(SUBURB_CONTEXT_LINKS.map(link => link.href), [
    '/cheapest-pints',
    '/insights/suburb-rankings',
    '/happy-hour',
  ])
})

test('link eligibility ignores price state but excludes invalid and permanently closed routes', () => {
  assert.equal(isCanonicalPubLinkEligible({ slug: 'open-tbc', suburb: 'Perth', businessStatus: 'OPERATIONAL' }), true)
  assert.equal(isCanonicalPubLinkEligible({ slug: 'open-unverified', suburb: 'Perth', businessStatus: null }), true)
  assert.equal(isCanonicalPubLinkEligible({ slug: 'closed', suburb: 'Perth', businessStatus: 'CLOSED_PERMANENTLY' }), false)
  assert.equal(isCanonicalPubLinkEligible({ slug: '', suburb: 'Perth', businessStatus: 'OPERATIONAL' }), false)
  assert.equal(isCanonicalPubLinkEligible({ slug: 'no-suburb', suburb: '', businessStatus: 'OPERATIONAL' }), false)
})
