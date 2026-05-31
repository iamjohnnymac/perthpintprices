// Deterministic anti-sameness picker for the ~850 templated pub/suburb pages.
// The same id always renders the same wording (predictable review diffs), and
// picks spread across the pool so no two pages collapse onto one phrasing — the
// scaled-content fingerprint Google penalises.
//
// Implemented with rendezvous (highest-random-weight) hashing rather than
// `hash(id) % pool.length`. The modulo approach reshuffles every id's pick when
// the pool grows; rendezvous gives a minimal-disruption growth contract:
// appending a phrasing reassigns an id ONLY to the new entry (never between
// existing entries), so adding a variant migrates a bounded ~1/n share onto it
// and leaves everyone else untouched.

// cyrb53 — a fast, well-distributed deterministic 53-bit string hash. No clock,
// no Math.random: identical output across runs and process restarts.
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/**
 * Deterministically pick one element of `pool`, seeded by `id`.
 *
 * Same `id` + same `pool` always returns the same element. Picks spread across
 * the pool. Appending an entry only ever moves an id onto the new entry.
 *
 * @throws if `pool` is empty.
 */
export function seededVariant<T>(id: string | number, pool: readonly T[]): T {
  if (pool.length === 0) {
    throw new Error('seededVariant: pool must not be empty')
  }
  const key = String(id)
  let bestIndex = 0
  let bestWeight = cyrb53(`${key}:0`)
  for (let i = 1; i < pool.length; i++) {
    const weight = cyrb53(`${key}:${i}`)
    if (weight > bestWeight) {
      bestWeight = weight
      bestIndex = i
    }
  }
  return pool[bestIndex]
}
