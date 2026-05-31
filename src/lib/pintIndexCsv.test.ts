import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPintIndexCsv } from './pintIndexCsv'

test('buildPintIndexCsv emits stable headers and escaped rows', () => {
  const csv = buildPintIndexCsv([
    {
      snapshotDate: '2026-05-31',
      averagePrice: 9.125,
      medianPrice: 9,
      minPrice: 6,
      maxPrice: 14.5,
      totalPubs: 857,
      totalSuburbs: 150,
      cheapestSuburb: 'Northbridge, Perth',
      cheapestSuburbAverage: 7.5,
      mostExpensiveSuburb: 'Cottesloe',
      mostExpensiveSuburbAverage: 12,
    },
  ])

  assert.match(csv, /^snapshot_date,average_pint_price_aud/)
  assert.match(csv, /2026-05-31,9.13,9.00,6.00,14.50,857,150,"Northbridge, Perth",7.50,Cottesloe,12.00/)
  assert.equal(csv.endsWith('\n'), true)
})
