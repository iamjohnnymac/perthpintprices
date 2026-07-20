import assert from 'node:assert/strict'
import test from 'node:test'

import { dynamic, revalidate } from './page'

test('Pint of the Day is request-dynamic so its Perth date cannot survive a stale revalidation window', () => {
  assert.equal(dynamic, 'force-dynamic')
  assert.equal(revalidate, 0)
})
