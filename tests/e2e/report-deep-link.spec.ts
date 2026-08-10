import { test, expect } from '@playwright/test'

test('cross-page nav: /discover "Report a price" opens the form on the homepage', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop SubPageNav CTA is hidden below sm; mobile path covered by the hamburger test')
  await page.goto('/discover')
  const cta = page.locator('a[href="/#report"]').first()
  await expect(cta).toBeVisible()
  await cta.click()
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  expect(new URL(page.url()).pathname + new URL(page.url()).hash).toBe('/')
})

test('direct load of /#report opens the form and cleans the fragment', async ({ page }) => {
  await page.goto('/#report')
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
})

test('hashchange while already on the homepage opens the form', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  await page.evaluate(() => { window.location.hash = '#report' })
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
})

test('backward compat: /?submit=1 still opens the form', async ({ page }) => {
  await page.goto('/?submit=1')
  await expect(page.locator('[role="dialog"]')).toBeVisible()
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
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  expect(new URL(page.url()).pathname + new URL(page.url()).hash).toBe('/')
})

test('mobile: homepage hamburger CTA opens the form in place (no navigation)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile nav only')
  await page.goto('/')
  await page.getByLabel('Open menu').click()
  await expect(page.locator('a[href="/#report"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Report a price', exact: true }).click()
  await expect(page.locator('[role="dialog"]')).toBeVisible()
})
