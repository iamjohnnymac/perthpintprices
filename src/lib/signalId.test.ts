import assert from 'node:assert/strict'
import test from 'node:test'
import { generateSignalId, SIGNAL_ID_LENGTH } from './signalId'

test('generateSignalId returns a 10-char id', () => {
  assert.equal(generateSignalId().length, SIGNAL_ID_LENGTH)
  assert.equal(SIGNAL_ID_LENGTH, 10)
})

test('generateSignalId only uses base62 characters', () => {
  for (let i = 0; i < 100; i++) {
    assert.match(generateSignalId(), /^[0-9A-Za-z]{10}$/)
  }
})

test('generateSignalId does not collide over 1000 generations', () => {
  const seen = new Set<string>()
  for (let i = 0; i < 1000; i++) {
    seen.add(generateSignalId())
  }
  assert.equal(seen.size, 1000)
})
