import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { pubContentSkeleton, pubFingerprint, summariseFingerprints } from './pubFingerprint'

// Minimal pub-page shells. Real pages are much larger, but the fingerprint only
// looks at headings + section count, so these exercise the same code path.
function page(name: string, headings: string[], sections = headings.length): string {
  const head = `<head><title>${name}</title><script>1</script></head>`
  const secs = Array.from({ length: sections }, () => '<section>').join('')
  const hs = headings.join('')
  return `<html>${head}<body>${secs}<h1>${name}</h1>${hs}</body></html>`
}

describe('pubContentSkeleton', () => {
  it('strips the venue name and digits so identical modules collapse to one shell', () => {
    const a = pubContentSkeleton(page('El Grotto', ['<h2>Cheaper nearby</h2>', '<h3>How much is a pint at El Grotto?</h3>']), 'El Grotto')
    const b = pubContentSkeleton(page('The Sandbar', ['<h2>Cheaper nearby</h2>', '<h3>How much is a pint at The Sandbar?</h3>']), 'The Sandbar')
    // Same modules, different venue → same skeleton.
    assert.equal(a, b)
    assert.match(a, /NAME/)
    assert.doesNotMatch(a, /grotto|sandbar/i)
  })

  it('produces different skeletons when the module/question set differs', () => {
    const priceKnown = pubFingerprint(page('A Bar', ['<h2>Cheaper nearby</h2>', '<h3>How much is a pint at A Bar?</h3>', '<h3>Does A Bar have a happy hour?</h3>']), 'A Bar')
    const priceMissing = pubFingerprint(page('B Bar', ['<h2>Nearby verified prices</h2>']), 'B Bar')
    assert.notEqual(priceKnown, priceMissing)
  })

  it('ignores script/style/svg noise', () => {
    const clean = pubContentSkeleton('<body><section></section><h1>X</h1><h2>Cheaper nearby</h2></body>', 'X')
    const noisy = pubContentSkeleton('<body><svg><path/></svg><section></section><h1>X</h1><script>junk()</script><h2>Cheaper nearby</h2><style>.a{}</style></body>', 'X')
    assert.equal(clean, noisy)
  })
})

describe('summariseFingerprints', () => {
  it('reports many distinct shells for a varied set', () => {
    const fps = ['a', 'b', 'c', 'd', 'e', 'e', 'f']
    const r = summariseFingerprints(fps)
    assert.equal(r.total, 7)
    assert.equal(r.distinct, 6)
    assert.equal(r.clusters[0].count, 2) // the 'e' pair
  })

  it('flags a collapsed set — every page the same shell is one distinct fingerprint', () => {
    const collapsed = Array.from({ length: 50 }, () => 'same')
    const r = summariseFingerprints(collapsed)
    assert.equal(r.distinct, 1)
    assert.equal(r.largestClusterShare, 1)
  })

  it('a deliberately-collapsed page fixture yields a single shell across many venues', () => {
    // Same thin template, only the name changes — the scaled-content failure mode.
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']
    const fps = names.map((n) => pubFingerprint(page(n, ['<h2>About</h2>']), n))
    const r = summariseFingerprints(fps)
    assert.equal(r.distinct, 1)
  })
})
