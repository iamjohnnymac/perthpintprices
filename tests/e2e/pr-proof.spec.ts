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

  await expect(page.getByRole('heading', { name: 'The Court Hotel', exact: true, level: 1 })).toBeVisible()
  await expect(page.getByText(/pint price/i).first()).toBeVisible()
  // Freshness: the receipt shows an absolute "Checked <date>" (e.g. "17 Feb 2026")
  await expect(page.getByText(/Checked/i).first()).toBeVisible()
  await expect(page.getByText(/\d{1,2} [A-Z][a-z]{2} \d{4}/).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /Cheaper nearby|Pubs nearby/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /All Northbridge pub prices/i })).toBeVisible()
  await expect(page.locator('.leaflet-container')).toBeVisible()

  await attachProof(page, testInfo, 'pub-page')
})

test('discover and happy-hour pages render their primary experiences', async ({ page }, testInfo) => {
  await page.goto('/discover')
  await expect(page.getByRole('heading', { name: /where to find a cheap pint/i })).toBeAttached()
  await expect(page.getByText(/pint of the day/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data & Tools' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Perth Pint Index/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Venue Breakdown/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /See Perth's cheapest pints/i })).toHaveAttribute('href', '/cheapest-pints')

  await page.goto('/happy-hour')
  await expect(page.getByRole('heading', { name: /happy hours/i }).first()).toBeVisible()
  await expect(page.getByText(/deals|happy hour/i).first()).toBeVisible()

  await attachProof(page, testInfo, 'discover-happy-hour')
})

test('robots and sitemap endpoints expose crawlable production URLs', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toContain('Sitemap: https://perthpintprices.com/sitemap.xml')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  const xml = await sitemap.text()
  expect(xml).toContain('<urlset')
  expect(xml).toContain('https://perthpintprices.com/')
  expect(xml).not.toContain('/world-cup')
})

test('technical SEO routes return canonical, title, and removed-route responses', async ({ request }) => {
  const henleyBrook = await request.get('/henley-brook/the-henley-brook')
  expect(henleyBrook.status()).toBe(200)
  const henleyBrookHtml = await henleyBrook.text()
  expect(henleyBrookHtml).toContain('rel="canonical" href="https://perthpintprices.com/henley-brook/the-henley-brook"')
  expect(henleyBrookHtml).toMatch(/<title>The Henley Brook, Henley Brook:/)

  const retiredLegacyPub = await request.get('/pub/ruin-bar')
  expect(retiredLegacyPub.status()).toBe(410)

  const retiredFeature = await request.get('/pub-golf')
  expect(retiredFeature.status()).toBe(404)
})
