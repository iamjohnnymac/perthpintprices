import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  describePriceSource,
  normalizeReportSubmissionSource,
  normalizePriceConfidence,
  priceReportConfidence,
  priceReportSource,
  reportSubmissionSource,
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

  it('normalizes only supported structured submission sources', () => {
    assert.equal(normalizeReportSubmissionSource('menu_scan'), 'menu_scan')
    assert.equal(normalizeReportSubmissionSource('tier-c-report-hero'), 'tier_c_report_hero')
    assert.equal(normalizeReportSubmissionSource('scraped_menu'), null)
    assert.equal(reportSubmissionSource(undefined, undefined, 'outdated_flag'), 'stale_flag')
  })

  it('prefers structured submission source over legacy notes', () => {
    assert.equal(
      priceReportSource({ submission_source: 'official_menu', notes: 'Submitted via menu scan' }),
      'official_menu',
    )
    assert.equal(
      priceReportConfidence({
        submission_source: 'official_menu',
        source_url: 'https://example.com/menu',
        evidence_text: 'Swan Draught pint $10',
      }),
      'high',
    )
    assert.equal(priceReportConfidence({ submission_source: 'official_menu' }), 'medium')
    assert.equal(priceReportConfidence({ submission_source: 'community_bounty' }), 'low')
    assert.equal(priceReportConfidence({ submission_source: 'community_bounty', evidence_text: 'Photo shows $9' }), 'medium')
  })

  it('renders short source phrases for the pub page', () => {
    assert.equal(describePriceSource('andrew'), 'by Andrew')
    assert.equal(describePriceSource('ElevenLabs conv_123'), 'by Andrew')
    assert.equal(describePriceSource('crowdsourced'), 'by a local')
    assert.equal(describePriceSource('menu_scan'), 'from a menu scan')
    assert.equal(describePriceSource('official_menu'), 'from an official menu')
    assert.equal(describePriceSource('venue_submission'), 'from the venue')
    assert.equal(describePriceSource('aggregator_lead'), 'spotted online')
    assert.equal(describePriceSource(null), null)
  })
})
