import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { discoverOfficialMenuSources, extractLinks } from './officialMenuSources'

describe('official menu source discovery', () => {
  it('extracts and canonicalizes links against a base URL', () => {
    const links = extractLinks(`
      <a href="/drinks/">Drinks</a>
      <a href="#top">Top</a>
      <a href="mailto:test@example.com">Email</a>
    `, 'https://example.com/pub/')

    assert.deepEqual(links, [
      { url: 'https://example.com/drinks/', label: 'Drinks' },
    ])
  })

  it('ranks drinks and PDF menu links above generic pages', () => {
    const candidates = discoverOfficialMenuSources(`
      <a href="/contact/">Contact</a>
      <a href="/food-menu/">Food Menu</a>
      <a href="/drinks/">Drinks</a>
      <a href="/files/tap-list.pdf">Tap list PDF</a>
    `, 'https://example.com/')

    assert.equal(candidates[0].url, 'https://example.com/files/tap-list.pdf')
    assert.equal(candidates[0].type, 'pdf')
    assert.deepEqual(candidates[0].reasons, ['drinks-or-beer', 'pdf'])
    assert.equal(candidates[1].url, 'https://example.com/drinks/')
    assert.equal(candidates[2].url, 'https://example.com/food-menu/')
  })

  it('deduplicates links by canonical URL and keeps the higher score', () => {
    const candidates = discoverOfficialMenuSources(`
      <a href="/menu#lunch">Menu</a>
      <a href="/menu">Drinks menu</a>
    `, 'https://example.com/')

    assert.equal(candidates.length, 1)
    assert.equal(candidates[0].url, 'https://example.com/menu')
    assert.equal(candidates[0].score, 13)
  })
})
