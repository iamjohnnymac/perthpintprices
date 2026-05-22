import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { haversineDistanceKm } from './location'

const expectWithinKm = (actual: number, expected: number, toleranceKm = 1) => {
  assert.ok(
    Math.abs(actual - expected) <= toleranceKm,
    `expected ${actual}km to be within ${toleranceKm}km of ${expected}km`,
  )
}

describe('haversineDistanceKm', () => {
  it('returns 0 for identical coordinates', () => {
    assert.equal(haversineDistanceKm(-31.9505, 115.8605, -31.9505, 115.8605), 0)
  })

  it('calculates the distance from Perth CBD to Fremantle', () => {
    expectWithinKm(
      haversineDistanceKm(-31.9505, 115.8605, -32.0569, 115.7439),
      16,
    )
  })

  it('calculates the distance from Sydney to Perth', () => {
    expectWithinKm(
      haversineDistanceKm(-33.8688, 151.2093, -31.9505, 115.8605),
      3290,
    )
  })

  it('calculates the distance between antipodal points', () => {
    expectWithinKm(haversineDistanceKm(0, 0, 0, 180), 20015)
  })
})
