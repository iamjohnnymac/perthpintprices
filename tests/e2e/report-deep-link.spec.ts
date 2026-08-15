import { test, expect, type Page } from '@playwright/test'

// Next's dev error overlay also carries role="dialog", so scope to the app's own
// modal. This keeps the spec runnable against a dev server as well as a build.
const SUBMIT_DIALOG = '[role="dialog"]:not([data-nextjs-dialog])'

// Both deep-link paths clean up from inside an effect, so poll the whole
// relative URL rather than reading it once — query and fragment included.
function relativeUrl(page: Page): string {
  const url = new URL(page.url())
  return url.pathname + url.search + url.hash
}

test('cross-page nav: /discover "Report a price" opens the form on the homepage', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop SubPageNav CTA is hidden below sm; mobile path covered by the hamburger test')
  await page.goto('/discover')
  const cta = page.locator('a[href="/#report"]').first()
  await expect(cta).toBeVisible()
  await cta.click()
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expect.poll(() => relativeUrl(page)).toBe('/')
})

test('direct load of /#report opens the form and cleans the fragment', async ({ page }) => {
  await page.goto('/#report')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expect.poll(() => relativeUrl(page)).toBe('/')
})

test('hashchange while already on the homepage opens the form', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator(SUBMIT_DIALOG)).toHaveCount(0)
  await page.evaluate(() => { window.location.hash = '#report' })
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expect.poll(() => relativeUrl(page)).toBe('/')
})

test('legacy /?submit=1 opens the form and cleans the URL', async ({ page }) => {
  // Regression test for #258: router.replace() no-opped when dropping the last
  // query param left the same pathname, so submit=1 survived the clean.
  await page.goto('/?submit=1')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expect.poll(() => relativeUrl(page)).toBe('/')
})

test('legacy /?submit=1 keeps the other params it was loaded with', async ({ page }) => {
  // The clean drops only submit — a filter carried alongside it must survive,
  // which is what distinguishes this from hard-resetting the URL to /.
  await page.goto('/?submit=1&vibe=cosy')
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
  await expect.poll(() => relativeUrl(page)).toBe('/?vibe=cosy')
})

test('/?submit=1#report fires report_price_open once and cleans the URL', async ({ page }) => {
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
  await expect.poll(() => relativeUrl(page)).toBe('/')
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
  await expect.poll(() => relativeUrl(page)).toBe('/')
})

test('mobile: homepage hamburger CTA opens the form in place (no navigation)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile nav only')
  await page.goto('/')
  await page.getByLabel('Open menu').click()
  await expect(page.locator('a[href="/#report"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Report a price', exact: true }).click()
  await expect(page.locator(SUBMIT_DIALOG)).toBeVisible()
})
