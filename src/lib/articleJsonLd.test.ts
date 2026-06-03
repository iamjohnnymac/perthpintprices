import assert from 'node:assert/strict'
import test from 'node:test'
import { buildArticleJsonLd } from './articleJsonLd'

test('buildArticleJsonLd emits Article schema with freshness fields', () => {
  const jsonLd = buildArticleJsonLd({
    url: 'https://perthpintprices.com/insights/pint-index',
    headline: 'Perth Pint Index',
    description: 'Track Perth pint prices.',
    dateModified: '2026-05-31T00:00:00.000Z',
    lastReviewed: '2026-05-31T00:00:00.000Z',
  })

  assert.equal(jsonLd['@context'], 'https://schema.org')
  assert.equal(jsonLd['@type'], 'Article')
  assert.equal(jsonLd['@id'], 'https://perthpintprices.com/insights/pint-index#article')
  assert.deepEqual(jsonLd.mainEntityOfPage, {
    '@type': 'WebPage',
    '@id': 'https://perthpintprices.com/insights/pint-index',
    lastReviewed: '2026-05-31T00:00:00.000Z',
  })
  assert.equal(jsonLd.author.name, 'Perth Pint Prices')
  assert.equal(jsonLd.dateModified, '2026-05-31T00:00:00.000Z')
  assert.equal('dateReviewed' in jsonLd, false)
})

test('buildArticleJsonLd can emit BlogPosting schema for articles', () => {
  const jsonLd = buildArticleJsonLd({
    url: 'https://perthpintprices.com/articles/pints-under-10-perth',
    headline: 'Where Perth still has pints under $10',
    description: 'Perth pubs with verified pints under $10.',
    datePublished: '2026-06-03T00:00:00.000+08:00',
    dateModified: '2026-06-03T00:00:00.000+08:00',
    lastReviewed: '2026-06-03T00:00:00.000+08:00',
    imageUrl: 'https://perthpintprices.com/og-image.png',
    type: 'BlogPosting',
  })

  assert.equal(jsonLd['@type'], 'BlogPosting')
  assert.equal(jsonLd.datePublished, '2026-06-03T00:00:00.000+08:00')
  assert.equal(jsonLd.image, 'https://perthpintprices.com/og-image.png')
})
