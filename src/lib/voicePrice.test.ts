import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeVoicePintPrice, normalizeVoiceUnit, parseVoiceNumber } from './voicePrice'

describe('voice price normalization', () => {
  it('unwraps vendor collection values and parses numeric strings', () => {
    assert.equal(parseVoiceNumber({ value: { value: '8.50 dollars' } }), 8.5)
    assert.equal(parseVoiceNumber({ value: 'not supplied' }), null)
  })

  it('normalizes supported glass sizes to a pint equivalent', () => {
    assert.equal(normalizeVoicePintPrice(9, 'pint'), 9)
    assert.equal(normalizeVoicePintPrice({ value: 7.5 }, { value: 'schooner' }), 10.06)
    assert.equal(normalizeVoicePintPrice('5', 'pot'), 10)
    assert.equal(normalizeVoiceUnit('unknown'), 'pint')
  })

  it('drops implausible normalized prices', () => {
    assert.equal(normalizeVoicePintPrice(4.99, 'pint'), null)
    assert.equal(normalizeVoicePintPrice(21, 'pint'), null)
    assert.equal(normalizeVoicePintPrice(null, 'pint'), null)
  })
})
