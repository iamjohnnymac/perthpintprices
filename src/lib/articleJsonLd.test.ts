import assert from 'node:assert/strict'
import test from 'node:test'
import { buildArticleJsonLd } from './articleJsonLd'

test('buildArticleJsonLd emits Article schema with freshness fields', () => {
  const jsonLd = buildArticleJsonLd({
    url: 'https://perthpintprices.com/insights/pint-index',
    headline: 'Perth Pint Index',
    description: 'Track Perth pint prices.',
    dateModified: '2026-05-31T00:00:00.000Z',
    dateReviewed: '2026-05-31T00:00:00.000Z',
  })

  assert.equal(jsonLd['@context'], 'https://schema.org')
  assert.equal(jsonLd['@type'], 'Article')
  assert.equal(jsonLd['@id'], 'https://perthpintprices.com/insights/pint-index#article')
  assert.deepEqual(jsonLd.mainEntityOfPage, {
    '@type': 'WebPage',
    '@id': 'https://perthpintprices.com/insights/pint-index',
  })
  assert.equal(jsonLd.author.name, 'Perth Pint Prices')
  assert.equal(jsonLd.dateModified, '2026-05-31T00:00:00.000Z')
  assert.equal(jsonLd.dateReviewed, '2026-05-31T00:00:00.000Z')
})
