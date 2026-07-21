import assert from 'node:assert/strict'
import test from 'node:test'
import { assertPubJoins, assertRowIdentity, csvRows, validateCohorts } from './build-gsc-indexing-baseline.mjs'

const row = (url, crawled = '2026-07-01') => `https://perthpintprices.com${url},${crawled}`
const csv = rows => `URL,Last crawled\n${rows.join('\n')}\n`

test('rejects malformed and duplicate export rows', () => {
  assert.throws(() => csvRows(csv(['not-a-url,2026-07-01']), 'crawled'), /malformed URL/)
  assert.throws(() => csvRows(csv(['https://perthpintprices.com/perth/example,']), 'crawled'), /missing Last crawled/)
  const crawled = csvRows(csv([row('/perth/example')]), 'crawled')
  const discovered = csvRows(csv([row('/perth/example', '1970-01-01')]), 'discovered')
  assert.throws(() => validateCohorts(crawled, discovered), /Duplicate URL/)
})

test('rejects dropped output and unjoined pub routes', () => {
  const input = new Set(['https://perthpintprices.com/perth/example'])
  assert.throws(() => assertRowIdentity(input, []), /identity mismatch/)
  assert.throws(() => assertPubJoins([{ url: 'https://perthpintprices.com/perth/example' }], new Map()), /Unjoined current pub route/)
})
