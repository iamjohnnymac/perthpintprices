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
})
