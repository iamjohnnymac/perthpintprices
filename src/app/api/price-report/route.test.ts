import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { preparePriceReport } from './intake'

describe('price-report intake preparation', () => {
  it('defaults omitted submission_source to manual', () => {
    const result = preparePriceReport({
      pub_slug: 'test-pub',
      reported_price: '10',
      beer_type: 'Swan Draught',
    }, 'ip-hash')

    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.value.insertData.submission_source, 'manual')
    assert.equal(result.value.insertData.reported_price, 10)
    assert.equal(result.value.insertData.report_type, 'price_report')
    assert.equal(result.value.isMenuScan, false)
  })

  it('stores structured evidence fields for menu scan submissions', () => {
    const result = preparePriceReport({
      pub_slug: 'test-pub',
      reported_price: 9,
      beer_type: 'Single Fin',
      price_type: 'happy_hour',
      submission_source: 'menu_scan',
      source_url: ' https://example.com/menu ',
      evidence_text: 'Single Fin pint $9',
      observed_at: '2026-06-01T04:30:00.000Z',
      raw_extraction: { model: 'test', text: 'Single Fin $9' },
      extractor_version: 'menu-scan-test',
    }, 'ip-hash')

    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.value.isMenuScan, true)
    assert.deepEqual(result.value.insertData, {
      pub_slug: 'test-pub',
      reported_price: 9,
      beer_type: 'Single Fin',
      reporter_name: 'Anonymous',
      ip_hash: 'ip-hash',
      report_type: 'happy_hour_report',
      notes: null,
      submission_source: 'menu_scan',
      source_url: 'https://example.com/menu',
      evidence_text: 'Single Fin pint $9',
      observed_at: '2026-06-01T04:30:00.000Z',
      raw_extraction: { model: 'test', text: 'Single Fin $9' },
      extractor_version: 'menu-scan-test',
    })
  })

  it('forces outdated flags to stale_flag without requiring a price', () => {
    const result = preparePriceReport({
      pub_slug: 'test-pub',
      outdated: true,
      submission_source: 'manual',
      notes: '[closed] Price looks old',
    }, 'ip-hash')

    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.value.insertData.submission_source, 'stale_flag')
    assert.equal(result.value.insertData.reported_price, 0)
    assert.equal(result.value.insertData.report_type, 'outdated_flag')
  })

  it('rejects unsupported submission_source values', () => {
    const result = preparePriceReport({
      pub_slug: 'test-pub',
      reported_price: 10,
      submission_source: 'crawler_guess',
    }, 'ip-hash')

    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.status, 400)
    assert.equal(result.error, 'submission_source is invalid')
  })
})
