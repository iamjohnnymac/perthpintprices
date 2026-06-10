import assert from 'node:assert/strict'
import test from 'node:test'
import robots from './robots'

test('robots explicitly allows AI citation crawlers while keeping private routes blocked', () => {
  const result = robots()
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
  const aiRule = rules.find(rule => Array.isArray(rule.userAgent)
    && rule.userAgent.includes('GPTBot')
    && rule.userAgent.includes('PerplexityBot')
    && rule.userAgent.includes('Google-Extended'))

  assert.ok(aiRule)
  assert.equal(aiRule.allow, '/')
  assert.deepEqual(aiRule.disallow, ['/admin', '/api/', '/signal/'])
  assert.equal(result.sitemap, 'https://perthpintprices.com/sitemap.xml')
})

test('robots keeps semi-private signal links out of every crawler', () => {
  const result = robots()
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
  for (const rule of rules) {
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    assert.ok(disallow.includes('/signal/'))
  }
})
