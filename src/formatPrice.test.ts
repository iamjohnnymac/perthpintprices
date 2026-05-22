import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { formatPrice } from './formatPrice.js'

test('formatPrice formats integer cents to dollar string', () => {
  assert.equal(formatPrice(450), '$4.50')
})
