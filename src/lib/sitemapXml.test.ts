import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSitemapIndexXml, buildUrlSetXml, sitemapIndexResponse, urlSetResponse } from './sitemapXml'

test('sitemap XML escapes locations and emits standards-shaped XML', () => {
  const index = buildSitemapIndexXml([{ url: 'https://perthpintprices.com/sitemap?a=1&b=2', lastModified: '2026-07-21T00:00:00.000Z' }])
  const urlset = buildUrlSetXml([{ url: 'https://perthpintprices.com/fremantle/a&b', lastModified: '2026-07-21T00:00:00.000Z', changeFrequency: 'weekly', priority: 0.5 }])

  assert.match(index, /<sitemapindex /)
  assert.match(index, /a=1&amp;b=2/)
  assert.match(urlset, /<urlset /)
  assert.match(urlset, /a&amp;b/)
  assert.match(urlset, /<priority>0.5<\/priority>/)
})

test('XML route responses advertise XML and cache for the route revalidation period', () => {
  const index = sitemapIndexResponse([])
  const urls = urlSetResponse([])
  assert.equal(index.headers.get('content-type'), 'application/xml; charset=utf-8')
  assert.equal(urls.headers.get('cache-control'), 'public, max-age=3600, s-maxage=3600')
})
