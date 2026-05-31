import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { seededVariant } from './seededVariant'

const POOL = ['alpha', 'bravo', 'charlie'] as const

describe('seededVariant', () => {
  it('returns the same element for the same id across repeated calls', () => {
    const first = seededVariant('the-norfolk-hotel', POOL)
    for (let i = 0; i < 5; i++) {
      assert.equal(seededVariant('the-norfolk-hotel', POOL), first)
    }
  })

  it('pins specific id -> phrasing picks (regression against hash drift)', () => {
    // Goldens observed from the shipped cyrb53 + HRW impl. If the hash or the
    // selection changes, these break — which is the point: ~850 live pages would
    // silently re-word otherwise.
    assert.equal(seededVariant('the-norfolk-hotel', POOL), 'alpha')
    assert.equal(seededVariant('the-river', POOL), 'bravo')
    assert.equal(seededVariant('fremantle', POOL), 'alpha')
    assert.equal(seededVariant('northbridge', POOL), 'bravo')
  })

  it('always returns an element of the pool', () => {
    for (let i = 0; i < 200; i++) {
      assert.ok(POOL.includes(seededVariant(`pub-${i}`, POOL)))
    }
  })

  it('treats a numeric id the same as its string form', () => {
    assert.equal(seededVariant(42, POOL), seededVariant('42', POOL))
    assert.equal(seededVariant(0, POOL), seededVariant('0', POOL))
  })

  it('returns the sole element for a single-entry pool', () => {
    assert.equal(seededVariant('anything', ['only']), 'only')
  })

  it('throws on an empty pool', () => {
    assert.throws(() => seededVariant('x', []), /pool must not be empty/)
  })

  it('spreads picks across the pool without starving or dominating any entry', () => {
    const counts: Record<string, number> = { alpha: 0, bravo: 0, charlie: 0 }
    const n = 1000
    for (let i = 0; i < n; i++) counts[seededVariant(`pub-${i}`, POOL)]++
    for (const entry of POOL) {
      const share = counts[entry] / n
      assert.ok(share > 0.25 && share < 0.42, `${entry} share ${share.toFixed(3)} out of band`)
    }
  })

  it('only reassigns an id onto the appended entry when the pool grows', () => {
    const before = ['alpha', 'bravo', 'charlie'] as const
    const after = ['alpha', 'bravo', 'charlie', 'delta'] as const
    let movedToNew = 0
    for (let i = 0; i < 1000; i++) {
      const id = `pub-${i}`
      const was = seededVariant(id, before)
      const now = seededVariant(id, after)
      if (now !== was) {
        // The only legal move is onto the new entry — never between existing ones.
        assert.equal(now, 'delta', `id ${id} moved ${was} -> ${now}, not onto the new entry`)
        movedToNew++
      }
    }
    assert.ok(movedToNew > 0, 'appended entry was dead on arrival')
    // HRW theory puts the migrated share near 1/4 (3 -> 4 entries); 0.4n leaves
    // headroom while still failing a picker that reshuffles most ids.
    assert.ok(movedToNew < 1000 * 0.4, `${movedToNew} ids moved — not minimal disruption`)
  })
})
