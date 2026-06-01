import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { countMenuScanReports } from './rateLimit'

describe('menu-scan rate limit helpers', () => {
  it('counts structured menu scan reports and legacy note-marker rows', () => {
    assert.equal(countMenuScanReports([
      { submission_source: 'menu_scan', notes: null },
      { submission_source: 'manual', notes: 'Submitted via menu scan' },
      { submission_source: 'manual', notes: 'Regular report' },
      { submission_source: null, notes: null },
    ]), 2)
  })
})
