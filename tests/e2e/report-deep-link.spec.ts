import { test, expect, type Page } from '@playwright/test'

// Next's dev error overlay also carries role="dialog", so scope to the app's own
// modal. This keeps the spec runnable against a dev server as well as a build.
const SUBMIT_DIALOG = '[role="dialog"]:not([data-nextjs-dialog])'
const PUB_SEARCH = 'input[placeholder="Search pubs by name..."]'

// Both deep-link paths clean up from inside an effect, so poll the whole
// relative URL rather than reading it once — query and fragment included.
function relativeUrl(page: Page): string {
  const url = new URL(page.url())
  return url.pathname + url.search + url.hash
}

// Settle-then-assert. A bare poll goes green on a transient match, which is how
// a URL that gets reverted ~300ms later slipped through review once: the
// debounced filter sync runs at 300ms, so wait past it and re-assert. The fixed
// wait is the point here, not a synchronisation crutch.
async function expectSettledUrl(page: Page, expected: string) {
  await expect.poll(() => relativeUrl(page)).toBe(expected)
  await page.waitForTimeout(1000)
  expect(relativeUrl(page), 'URL reverted after settling').toBe(expected)
}

test('cross-page nav: /discover "Report a price" opens the form on the homepage', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop SubPageNav CTA is hidden below sm; mobile path covered by the hamburger test')
  await page.goto('/discover')
  const cta = page.locator('a[href="/#report"]').first()
  await expect(cta).toBeVisible()
  await cta.click()
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expectSettledUrl(page, '/')
})

test('hashchange while already on the homepage opens the form', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator(SUBMIT_DIALOG)).toHaveCount(0)
  await page.evaluate(() => { window.location.hash = '#report' })
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expectSettledUrl(page, '/')
})

test('direct load of /#report opens the form', async ({ page }) => {
  await page.goto('/#report')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
})

test('legacy /?submit=1 opens the form', async ({ page }) => {
  await page.goto('/?submit=1')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
})

test('/?submit=1#report fires report_price_open exactly once', async ({ page }) => {
  // Both deep-link paths match this hand-crafted URL. The query-param effect owns
  // it; the hash effect must bow out so the event does not double-fire.
  await page.addInitScript(() => {
    const w = window as unknown as { __openEvents: string[]; gtag?: (...args: unknown[]) => void }
    w.__openEvents = []
    w.gtag = (...args: unknown[]) => {
      if (args[0] === 'event' && args[1] === 'report_price_open') {
        w.__openEvents.push(String((args[2] as { source?: string })?.source))
      }
    }
  })
  await page.goto('/?submit=1#report')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  const events = await page.evaluate(() => (window as unknown as { __openEvents: string[] }).__openEvents)
  expect(events).toEqual(['submit_query_param'])
})

test('homepage HTML contains no submit=1 hrefs', async ({ page }) => {
  const res = await page.request.get('/')
  const html = await res.text()
  expect(html).not.toContain('submit=1')
})

test('mobile: hamburger CTA on a sub-page deep-links to the homepage form', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile nav only')
  await page.goto('/discover')
  await page.getByLabel('Open menu').click()
  const cta = page.locator('a[href="/#report"]').first()
  await expect(cta).toBeVisible()
  await cta.click()
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expectSettledUrl(page, '/')
})

test('mobile: homepage hamburger CTA opens the form in place (no navigation)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile nav only')
  await page.goto('/')
  await page.getByLabel('Open menu').click()
  await expect(page.locator('a[href="/#report"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Report a price', exact: true }).click()
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
})

// ---------------------------------------------------------------------------
// Known-failing. These are the behaviours #258 is really about. They are marked
// fixme rather than deleted so the intended contract stays written down and
// turns green the moment the underlying defect is fixed.
//
// Measured against a production build on main: entering the homepage with ANY
// query string leaves the filter sync inert — router.replace() from
// updateUrlParams never reaches the address bar again for the life of that
// mount. It reproduces with no deep-link involvement at all (/?vibe=cosy and
// /?utm_source=n both freeze; a bare / entry is fine), so ?submit=1 is only one
// symptom. That inertness is also why the entry URL cannot be cleaned: a
// router.replace() clean is swallowed, and a history.replaceState() clean moves
// the address bar but leaves the router's own snapshot on the entry URL, which
// it then restores on the next navigation.
// ---------------------------------------------------------------------------

test.fixme('legacy /?submit=1 cleans the URL after opening the form', async ({ page }) => {
  await page.goto('/?submit=1')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expectSettledUrl(page, '/')
})

test.fixme('direct load of /#report cleans the fragment', async ({ page }) => {
  // Pre-existing since the /#report deep link shipped: the fragment survives the
  // clean on an entry load and rides along on every later URL update.
  await page.goto('/#report')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expectSettledUrl(page, '/')
})

test.fixme('the page stays usable after a query-string entry', async ({ page }) => {
  // Not deep-link specific — /?vibe=cosy and /?utm_source=n fail this too.
  await page.goto('/?submit=1')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator(SUBMIT_DIALOG)).toHaveCount(0)
  await page.locator(PUB_SEARCH).first().fill('hello')
  await expectSettledUrl(page, '/?q=hello')
  await expect(page.locator(SUBMIT_DIALOG)).toHaveCount(0)
})
