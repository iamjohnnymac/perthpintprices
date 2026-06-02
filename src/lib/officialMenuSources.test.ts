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

  it('deduplicates trailing slash variants', () => {
    const candidates = discoverOfficialMenuSources(`
      <a href="/drinks">Drinks</a>
      <a href="/drinks/">Drinks</a>
    `, 'https://example.com/')

    assert.equal(candidates.length, 1)
    assert.equal(candidates[0].url, 'https://example.com/drinks')
  })

  it('skips unresolved CMS template links', () => {
    const candidates = discoverOfficialMenuSources(`
      <a href="/eat-drink/[%= item.url %]">Drinks menu</a>
      <a href="/menu">Menu</a>
    `, 'https://example.com/')

    assert.deepEqual(candidates.map((candidate) => candidate.url), [
      'https://example.com/menu',
    ])
  })

  it('discovers embedded menu provider resources', () => {
    const candidates = discoverOfficialMenuSources(`
      <iframe src="https://mryum.com/example-venue" title="Order menu"></iframe>
      <script src="https://cdn.example.com/site.js"></script>
    `, 'https://example.com/')

    assert.equal(candidates[0].url, 'https://mryum.com/example-venue')
    assert.deepEqual(candidates[0].reasons, ['menu', 'menu-provider'])
  })

  it('skips static assets and generic images', () => {
    const candidates = discoverOfficialMenuSources(`
      <link href="/wp-content/plugins/nav-menu.css" rel="stylesheet">
      <a href="/photos/banner.jpg">Photo</a>
      <a href="/photos/outdoor-beer-garden.jpg">Beer garden</a>
      <a href="/assets/beer-C32UEuZ2.avif">Beer image</a>
      <a href="/files/bar-menu.png">Bar menu image</a>
    `, 'https://example.com/')

    assert.deepEqual(candidates.map((candidate) => candidate.url), [
      'https://example.com/files/bar-menu.png',
    ])
    assert.deepEqual(candidates[0].reasons, ['drinks-or-beer', 'menu', 'image-asset'])
  })

  it('skips booking and gift-card providers without menu intent', () => {
    const candidates = discoverOfficialMenuSources(`
      <a href="https://bookings.nowbookit.com/?accountid=123">Book now</a>
      <a href="https://giftcards.nowbookit.com/cards/card-selection?accountid=123">Gift cards</a>
    `, 'https://example.com/')

    assert.deepEqual(candidates, [])
  })

  it('skips ecommerce product pages without menu intent', () => {
    const candidates = discoverOfficialMenuSources(`
      <a href="/product-category/beer/">Beer shop</a>
      <a href="/shop/lager/">Buy lager</a>
      <a href="/bar-menu/">Bar menu</a>
    `, 'https://example.com/')

    assert.deepEqual(candidates.map((candidate) => candidate.url), [
      'https://example.com/bar-menu/',
    ])
  })

  it('discovers menu URLs from JSON-LD', () => {
    const candidates = discoverOfficialMenuSources(`
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "menu": "/drinks-menu"
        }
      </script>
    `, 'https://example.com/pub/')

    assert.equal(candidates[0].url, 'https://example.com/drinks-menu')
    assert.deepEqual(candidates[0].reasons, ['drinks-or-beer', 'menu'])
  })
})
