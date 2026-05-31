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
  assert.deepEqual(aiRule.disallow, ['/admin', '/api/'])
  assert.equal(result.sitemap, 'https://perthpintprices.com/sitemap.xml')
})
