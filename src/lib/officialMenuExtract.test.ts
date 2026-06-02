import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { extractOfficialMenuCandidates, menuLines } from './officialMenuExtract'

describe('official menu extraction', () => {
  it('extracts conservative pint candidates from menu text', () => {
    const candidates = extractOfficialMenuCandidates(`
      Swan Draught pint $10
      Single Fin draught pint $12.50
      Fish and chips $28
    `)

    assert.deepEqual(candidates, [
      { beerType: 'Swan', price: 10, evidenceText: 'Swan Draught pint $10' },
      { beerType: 'Single Fin', price: 12.5, evidenceText: 'Single Fin draught pint $12.50' },
    ])
  })

  it('skips happy-hour and non-drink menu prices', () => {
    const candidates = extractOfficialMenuCandidates(`
      Happy hour pints $8
      Beef burger $24
      House wine $11
      Tap lager $9
      Apple Juice, Dry Ginger Ale, Lime 12
      Moscow Mule, vodka, ginger beer, lime + ice $18.90
    `)

    assert.deepEqual(candidates, [
      { beerType: 'lager', price: 9, evidenceText: 'Tap lager $9' },
    ])
  })

  it('normalizes basic html into readable lines', () => {
    assert.deepEqual(menuLines('<ul><li>Swan Draught pint&nbsp;$10</li><li>Fish &amp; chips $28</li></ul>'), [
      'Swan Draught pint $10',
      'Fish & chips $28',
    ])
  })

  it('rejects prices outside the expected pint range', () => {
    assert.deepEqual(extractOfficialMenuCandidates('Tap beer $2\nFancy beer pint $42'), [])
  })

  it('accepts bare menu prices for clearly labelled draught beer lines', () => {
    const candidates = extractOfficialMenuCandidates(`
      Rotating Tap Beers 12
      Stone and Wood Pacific Ale 13.50
      Beer battered fish 28
    `)

    assert.deepEqual(candidates, [
      { beerType: 'Rotating', price: 12, evidenceText: 'Rotating Tap Beers 12' },
      { beerType: 'Stone and Wood Pacific Ale', price: 13.5, evidenceText: 'Stone and Wood Pacific Ale 13.50' },
    ])
  })

  it('skips beer lines with multiple explicit prices', () => {
    assert.deepEqual(extractOfficialMenuCandidates('Classic lager $10 $15'), [])
  })

  it('skips mixed beverage lines where the price belongs to cocktails or wine', () => {
    assert.deepEqual(
      extractOfficialMenuCandidates('SPRITZES $19 VASSE FELIX PREMIER CHARDONNAY (BTL ONLY) WA 99 COOPERS PALE ALE 4.5%'),
      [],
    )
  })

  it('skips cocktail mixer and food-combo pint lines', () => {
    assert.deepEqual(
      extractOfficialMenuCandidates(`
        Makers Mark, ginger beer and lime $20 LUNCH SPECIALS
        $30 Roast & Pint
      `),
      [],
    )
  })

  it('skips non-alcoholic beer lines', () => {
    assert.deepEqual(
      extractOfficialMenuCandidates(`
        Lightning Minds Non Alcoholic Pale Ale - 9
        Pale Ale - Lightning Minds 12
        Heaps Normal Another Lager 11
        Hiatus Pacific Ale 11
        Swan Draught pint $10
      `),
      [{ beerType: 'Swan', price: 10, evidenceText: 'Swan Draught pint $10' }],
    )
  })

  it('combines drink lines with adjacent price-only lines', () => {
    const candidates = extractOfficialMenuCandidates(`
      Rotating Tap Beers
      12
      Fish Burger
      26
    `)

    assert.deepEqual(candidates, [
      { beerType: 'Rotating', price: 12, evidenceText: 'Rotating Tap Beers 12' },
    ])
  })

  it('extracts schema.org MenuItem offers from JSON-LD', () => {
    const candidates = extractOfficialMenuCandidates(`
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Menu",
          "hasMenuSection": {
            "@type": "MenuSection",
            "hasMenuItem": [
              {
                "@type": "MenuItem",
                "name": "Swan Draught pint",
                "offers": { "@type": "Offer", "price": "10" }
              },
              {
                "@type": "MenuItem",
                "name": "Beef burger",
                "offers": { "@type": "Offer", "price": "24" }
              }
            ]
          }
        }
      </script>
    `)

    assert.deepEqual(candidates, [
      { beerType: 'Swan', price: 10, evidenceText: 'Swan Draught pint $10' },
    ])
  })
})
