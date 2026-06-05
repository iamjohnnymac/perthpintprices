import { expect, test, type Page, type TestInfo } from '@playwright/test'

async function attachProof(page: Page, testInfo: TestInfo, name: string) {
  const screenshot = await page.screenshot({ fullPage: true })

  await testInfo.attach(`${testInfo.project.name} ${name}`, {
    body: screenshot,
    contentType: 'image/png',
  })
}

test('homepage renders the core discovery experience', async ({ page }, testInfo) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /perth's pints/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /discover/i }).first()).toBeVisible()
  await expect(page.getByText(/real pint prices/i).first()).toBeVisible()

  await attachProof(page, testInfo, 'homepage')
})

test('pub page renders price, freshness, map, and nearby prices', async ({ page }, testInfo) => {
  await page.goto('/northbridge/the-court-hotel')

  await expect(page.getByRole('heading', { name: 'The Court Hotel' })).toBeVisible()
  await expect(page.getByText(/pint price/i).first()).toBeVisible()
  // Freshness: the receipt shows an absolute "Checked <date>" (e.g. "17 Feb 2026")
  await expect(page.getByText(/Checked/i).first()).toBeVisible()
  await expect(page.getByText(/\d{1,2} [A-Z][a-z]{2} \d{4}/).first()).toBeVisible()
  await expect(page.getByText(/Cheaper nearby|Nearby verified prices/i).first()).toBeVisible()
  await expect(page.locator('.leaflet-container')).toBeVisible()

  await attachProof(page, testInfo, 'pub-page')
})
