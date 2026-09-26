import { test, expect, type Page } from '@playwright/test'

// Server HTML is rendered in UTC with en-AU formatting. A visitor whose browser
// uses another locale or timezone must hydrate the same text, or React throws
// error #418 and re-renders the page on the client. Guildford Hotel has a
// four-digit Google review count, which is where locale grouping differs.
const PUB_PATH = '/guildford/guildford-hotel'

function collectHydrationErrors(page: Page): string[] {
  const errors: string[] = []
  const isHydration = (text: string) => /#418|#423|#425|hydrat/i.test(text)
  page.on('pageerror', error => { if (isHydration(error.message)) errors.push(error.message) })
  page.on('console', message => {
    if (message.type() === 'error' && isHydration(message.text())) errors.push(message.text())
  })
  return errors
}

for (const { locale, timezoneId } of [
  { locale: 'de-DE', timezoneId: 'Europe/Berlin' },
  { locale: 'en-US', timezoneId: 'America/Los_Angeles' },
]) {
  test.describe(`pub page in ${locale}, ${timezoneId}`, () => {
    test.use({ locale, timezoneId })

    test('hydrates without a text mismatch', async ({ page }) => {
      const errors = collectHydrationErrors(page)
      await page.goto(PUB_PATH)
      await expect(page.locator('h1')).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(errors).toEqual([])
      await expect(page.getByText(/\(\d{1,3}(,\d{3})+\)/).first()).toBeVisible()
    })
  })
}

// The sunset guide derives the sun's position, status and overlays from the
// clock. A browser clock hours away from the cached server render must still
// hydrate cleanly, because those values only render after mount.
test.describe('sunset sippers guide with a shifted client clock', () => {
  test.use({ timezoneId: 'Australia/Perth' })

  test('hydrates without a mismatch', async ({ page }) => {
    const errors = collectHydrationErrors(page)
    await page.clock.install({ time: new Date(Date.now() + 3 * 60 * 60 * 1000) })
    await page.goto('/guides/sunset-sippers')
    await expect(page.getByRole('heading', { name: /Today.s Sunset/i })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
  })
})

test.describe('/discover with a shifted client clock', () => {
  test.use({ timezoneId: 'Australia/Perth' })

  for (const { label, offset } of [
    { label: '+3 hours', offset: 3 * 60 * 60 * 1000 },
    { label: '+1 day', offset: 24 * 60 * 60 * 1000 },
  ]) {
    test(`hydrates without a mismatch at ${label}`, async ({ page }) => {
      const errors = collectHydrationErrors(page)
      await page.clock.install({ time: new Date(Date.now() + offset) })
      await page.goto('/discover')
      await expect(page.locator('#best-buys')).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(errors).toEqual([])
    })
  }
})

// Sun times belong to Perth, so a visitor anywhere sees Perth's sunset and the
// same countdown. Open-Meteo is stubbed with a fixed Perth-local answer for the
// test's Perth date so the comparison doesn't depend on the live API.
test('sunset guide shows Perth times to visitors in any timezone', async ({ browser, baseURL }) => {
  const at = new Date()
  const perthDate = new Date(at.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const heroes: string[] = []

  for (const timezoneId of ['Australia/Perth', 'America/Los_Angeles', 'Asia/Tokyo']) {
    const context = await browser.newContext({ baseURL, timezoneId })
    await context.route('https://api.open-meteo.com/**', route => route.fulfill({
      json: { daily: { sunrise: [`${perthDate}T06:01`], sunset: [`${perthDate}T18:15`] } },
    }))
    const page = await context.newPage()
    const errors = collectHydrationErrors(page)
    await page.clock.setFixedTime(at)
    await page.goto('/guides/sunset-sippers')
    const hero = page.locator('section').filter({ has: page.getByRole('heading', { name: /Today.s Sunset/i }) }).first()
    await expect(hero.getByText('06:15 pm').first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    heroes.push(await hero.innerText())
    expect(errors).toEqual([])
    await context.close()
  }

  expect(heroes[1]).toBe(heroes[0])
  expect(heroes[2]).toBe(heroes[0])
})
