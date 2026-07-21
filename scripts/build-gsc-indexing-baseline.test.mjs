import assert from 'node:assert/strict'
import test from 'node:test'
import { chromium } from 'playwright'
import { assertPubJoins, assertRowIdentity, collectVisibleLinks, csvRows, EXPECTED_CRAWLED_COUNT, EXPECTED_DISCOVERED_COUNT, validDate, validateCohorts, validateExpectedCardinalities } from './build-gsc-indexing-baseline.mjs'

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

test('rejects calendar-impossible dates instead of normalizing them', () => {
  assert.equal(validDate('2026-02-28', 'report date'), '2026-02-28')
  assert.throws(() => validDate('2026-02-30', 'report date'), /Invalid report date/)
  assert.throws(() => validDate('2026-13-01', 'export date'), /Invalid export date/)
})

test('enforces the dated 99/18 cohort cardinalities', () => {
  const crawled = Array.from({ length: EXPECTED_CRAWLED_COUNT }, () => ({}))
  const discovered = Array.from({ length: EXPECTED_DISCOVERED_COUNT }, () => ({}))
  assert.doesNotThrow(() => validateExpectedCardinalities(crawled, discovered))
  assert.throws(() => validateExpectedCardinalities(crawled.slice(1), discovered), /Crawled cohort cardinality mismatch/)
  assert.throws(() => validateExpectedCardinalities([...crawled, {}], discovered), /Crawled cohort cardinality mismatch/)
  assert.throws(() => validateExpectedCardinalities(crawled, discovered.slice(1)), /Discovered cohort cardinality mismatch/)
  assert.throws(() => validateExpectedCardinalities(crawled, [...discovered, {}]), /Discovered cohort cardinality mismatch/)
})

test('browser visibility excludes hidden ancestors, inert content, CSS-hidden anchors and empty boxes', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.setContent(`<style>.gone { display: none } .invisible { visibility: hidden }</style>
      <a href="/visible">Visible</a>
      <div hidden><a href="/hidden-ancestor">Hidden</a></div>
      <div inert><a href="/inert">Inert</a></div>
      <div aria-hidden="true"><a href="/aria-hidden">ARIA hidden</a></div>
      <a class="gone" href="/display-none">Display none</a>
      <a class="invisible" href="/visibility-hidden">Visibility hidden</a>
      <a style="opacity:0" href="/transparent">Transparent</a>
      <a style="display:inline-block;width:0;height:0;overflow:hidden" href="/empty-box"></a>`)
    assert.deepEqual(await page.evaluate(collectVisibleLinks, 'https://perthpintprices.com'), ['https://perthpintprices.com/visible'])
  } finally {
    await browser.close()
  }
})
