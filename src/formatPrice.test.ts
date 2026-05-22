const assert = require('node:assert/strict')
const test = require('node:test')
const { formatPrice } = require('./formatPrice.ts')

test('formatPrice formats integer cents to dollar string', () => {
  assert.equal(formatPrice(450), '$4.50')
})
