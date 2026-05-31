import assert from 'node:assert/strict'
import test from 'node:test'
import { revalidate } from './page'

test('Pint Index refreshes Article freshness hourly', () => {
  assert.equal(revalidate, 3600)
})
