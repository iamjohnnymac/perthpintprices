import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { formatPrice, getPriceLabel, getPriceDiff } from './formatters.js'

test('formatPrice formats integer cents to dollar string', () => {
  assert.equal(formatPrice(450), '$4.50')
})

test('getPriceLabel buckets price against the average', () => {
  assert.equal(getPriceLabel(7, 9.20).type, 'bargain')
  assert.equal(getPriceLabel(9, 9.20).type, 'fair')
  assert.equal(getPriceLabel(12, 9.20).type, 'pricey')
  assert.equal(getPriceLabel(null).type, null)
})

test('getPriceDiff describes distance from the average', () => {
  assert.equal(getPriceDiff(9.20, 9.20), 'At avg')
  assert.equal(getPriceDiff(8, 9.20), '$1.20 below avg')
  assert.equal(getPriceDiff(11, 9.20), '$1.80 above avg')
  assert.equal(getPriceDiff(null), '')
})
