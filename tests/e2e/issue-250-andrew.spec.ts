import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type TestInfo } from '@playwright/test'

function viewportName(testInfo: TestInfo) {
  return testInfo.project.name.startsWith('mobile') ? 'mobile' : 'desktop'
}

async function saveEvidence(page: Page, testInfo: TestInfo, phase: 'before' | 'after', surface: string, state: string) {
  const directory = path.join(process.cwd(), 'artifacts', 'issue-250', phase, surface)
  mkdirSync(directory, { recursive: true })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(100)
  await page.screenshot({
    path: path.join(directory, `${state}-${viewportName(testInfo)}.png`),
    fullPage: true,
  })
}

const baselineURL = process.env.ISSUE_250_BASELINE_URL

const dashboardData = {
  overview: {
    totalPubs: 857,
    pricedPubs: 194,
    unpricedPubs: 663,
    suburbs: 150,
    avgPrice: 9.1,
    minPrice: 6,
    maxPrice: 16,
    vibeTagged: 320,
  },
  features: { happyHour: 168, cozyPubs: 21, sunsetSpots: 18, dadBars: 67, tabVenues: 56 },
  pushSubscriptions: { total: 24, active: 22 },
  priceReports: { total: 40, pending: 2, recent: [] },
  pubSubmissions: { total: 6, pending: 0, recent: [] },
  snapshot: null,
  priceHistory: { totalChanges: 120, recent: [] },
  recentlyUpdated: [],
  agentActivity: [],
  unpricedPubs: [],
  pubsList: [],
  generatedAt: new Date().toISOString(),
}

const completedCall = {
  ok: true,
  destination: { masked: '+61 ••• ••• 955' },
  conversation: { id: 'conv_demo_123456', status: 'done', terminal: true },
  transcript: [
    { role: 'Andrew', message: 'Asked for the current pint price, tap and happy hour.' },
    { role: 'Owner', message: 'A venue response was captured and converted into review fields.' },
  ],
  proposedListing: {
    price: 9,
    beerType: 'Swan Draught',
    happyHour: 'Mon–Fri · 4–6pm',
    confidence: 'high',
  },
}

test('Andrew price-check presentation surface has ready and completed states', async ({ page }, testInfo) => {
  if (baselineURL) {
    await page.goto(`${baselineURL}/ai-price-demo`)
    await expect(page.getByText('404')).toBeVisible()
    await saveEvidence(page, testInfo, 'before', 'ai-price-demo', 'route-absent')
  }

  await page.goto('/ai-price-demo')

  await expect(page.getByRole('heading', { name: /one phone call/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run illustrative check' })).toBeVisible()
  await expect(page.getByText('Illustrative price check', { exact: true })).toBeVisible()
  await expect(page.getByText('Example Arms · fictional venue')).toBeVisible()
  await expect(page.getByTestId('andrew-voice-sample')).toHaveAttribute('src', '/audio/andrew-price-check.mp3')
  const audioResponse = await page.request.get('/audio/andrew-price-check.mp3')
  expect(audioResponse.ok()).toBe(true)
  expect(audioResponse.headers()['content-type']).toContain('audio/mpeg')
  const readyCopy = await page.locator('body').innerText()
  expect(readyCopy).not.toMatch(/sandbox/i)
  await saveEvidence(page, testInfo, 'after', 'ai-price-demo', 'ready')

  await page.getByRole('button', { name: /Hear Andrew/ }).click()
  await expect.poll(() => page.getByTestId('andrew-voice-sample').evaluate((element) => {
    const audio = element as HTMLAudioElement
    return !audio.paused && audio.currentTime > 0
  })).toBe(true)
  await page.getByTestId('andrew-voice-sample').evaluate(element => element.dispatchEvent(new Event('ended')))
  await expect(page.getByRole('button', { name: /Replay Andrew/ })).toBeVisible()
  await page.getByRole('button', { name: /Replay Andrew/ }).click()
  await expect.poll(() => page.getByTestId('andrew-voice-sample').evaluate((element) => {
    const audio = element as HTMLAudioElement
    return !audio.paused
  })).toBe(true)
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect.poll(() => page.getByTestId('andrew-voice-sample').evaluate((element) => {
    const audio = element as HTMLAudioElement
    return audio.paused && audio.currentTime === 0
  })).toBe(true)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Run illustrative check' }).click()
  await expect(page.getByText('Update ready for review')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('Validated')).toBeVisible()
  await expect(page.getByText('$9', { exact: true }).first()).toBeVisible()
  const completeCopy = await page.locator('body').innerText()
  expect(completeCopy).not.toMatch(/published|verified/i)
  await saveEvidence(page, testInfo, 'after', 'ai-price-demo', 'completed')
})

test('authenticated Andrew admin tab shows consent, masked target, and captured preview', async ({ page }, testInfo) => {
  await page.route('**/api/admin/stats', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dashboardData) })
  })

  await page.route('**/api/admin/andrew/test-call**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          destination: { masked: '+61 ••• ••• 955' },
          conversation: { id: 'conv_demo_123456', status: 'initiated', terminal: false },
        }),
      })
      return
    }
    if (url.searchParams.has('conversation_id')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(completedCall) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        destination: { masked: '+61 ••• ••• 955' },
        availability: { state: 'ready', retryAfterSeconds: 0 },
      }),
    })
  })

  if (baselineURL) {
    await page.goto(`${baselineURL}/admin`)
    await page.locator('input[type="password"]').fill('review-password')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('Total Venues')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Andrew' })).toHaveCount(0)
    await saveEvidence(page, testInfo, 'before', 'admin', 'authenticated')
  }

  await page.goto('/admin')
  await page.locator('input[type="password"]').fill('review-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.getByRole('button', { name: 'Andrew' }).click()

  await expect(page.getByRole('heading', { name: 'Call the owner test line' })).toBeVisible()
  await expect(page.getByTestId('masked-destination')).toHaveText('+61 ••• ••• 955')
  await expect(page.getByText('No live price writes')).toBeVisible()
  await expect(page.getByText(/AI-generated call/)).toBeVisible()
  await saveEvidence(page, testInfo, 'after', 'admin', 'ready')

  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Call my test line' }).click()
  await expect(page.getByText('Capture ready for review').first()).toBeVisible({ timeout: 8000 })
  await expect(page.getByTestId('proposed-price')).toHaveText('$9')
  await expect(page.getByText('Private call events')).toBeVisible()
  await expect(page.getByTestId('andrew-transcript')).toContainText('A venue response was captured')
  await expect(page.getByTestId('andrew-transcript')).not.toContainText('Swan Draught is $9 a pint')
  await expect(page.getByText('Not published')).toBeVisible()
  await saveEvidence(page, testInfo, 'after', 'admin', 'completed')
})
