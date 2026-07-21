import assert from 'node:assert/strict'
import test from 'node:test'
import { GET } from './route'

test('llms.txt returns markdown with live canonical URLs only', async () => {
  const response = await GET()
  const body = await response.text()

  assert.equal(response.status, 200)
  assert.match(response.headers.get('Content-Type') || '', /text\/markdown/)
  assert.match(body, /^# Perth Pint Prices/)
  assert.match(body, /https:\/\/perthpintprices\.com\/insights\/pint-index/)
  assert.match(body, /https:\/\/perthpintprices\.com\/insights\/pint-index\/data\.csv/)
  assert.match(body, /https:\/\/perthpintprices\.com\/sitemap\.xml/)
  assert.match(body, /All legitimate pub pages are indexable and listed in the sitemap/)
  assert.doesNotMatch(body, /intentionally noindexed/)
  assert.doesNotMatch(body, /weekly-report/)
})
