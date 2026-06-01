import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  describePriceSource,
  normalizePriceConfidence,
  priceReportConfidence,
  priceReportSource,
} from './priceProvenance'

describe('price provenance helpers', () => {
  it('keeps only supported confidence values', () => {
    assert.equal(normalizePriceConfidence('HIGH'), 'high')
    assert.equal(normalizePriceConfidence('medium'), 'medium')
    assert.equal(normalizePriceConfidence('success'), null)
    assert.equal(normalizePriceConfidence(null), null)
  })

  it('classifies report provenance from notes', () => {
    assert.equal(priceReportSource('Submitted via menu scan'), 'menu_scan')
    assert.equal(priceReportConfidence('Submitted via menu scan'), 'low')
    assert.equal(priceReportSource('[source:tier-c-report-hero]'), 'crowdsourced')
    assert.equal(priceReportConfidence('[source:tier-c-report-hero]'), 'medium')
  })

  it('renders short source phrases for the pub page', () => {
    assert.equal(describePriceSource('andrew'), 'by Andrew')
    assert.equal(describePriceSource('ElevenLabs conv_123'), 'by Andrew')
    assert.equal(describePriceSource('crowdsourced'), 'by a local')
    assert.equal(describePriceSource('menu_scan'), 'from a menu scan')
    assert.equal(describePriceSource(null), null)
  })
})
