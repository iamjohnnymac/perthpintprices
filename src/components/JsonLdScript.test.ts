import assert from 'node:assert/strict'
import test from 'node:test'
import JsonLdScript from './JsonLdScript'

test('JsonLdScript renders escaped application/ld+json', () => {
  const element = JsonLdScript({
    data: {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: '<script>alert("nope")</script>',
    },
  })

  assert.equal(element.type, 'script')
  assert.equal(element.props.type, 'application/ld+json')
  assert.match(element.props.dangerouslySetInnerHTML.__html, /\\u003cscript>/)
  assert.doesNotMatch(element.props.dangerouslySetInnerHTML.__html, /<script>/)
})
