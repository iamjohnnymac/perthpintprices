import { test, expect, type Page } from '@playwright/test'

// Server HTML is rendered in UTC with en-AU formatting. A visitor whose browser
// uses another locale or timezone must hydrate the same text, or React throws
// error #418 and re-renders the page on the client. Guildford Hotel has a
// four-digit Google review count, which is where locale grouping differs.
const PUB_PATH = '/guildford/guildford-hotel'

// Mirrors playwright.config.ts: without CI or an explicit target, the suite runs
// against `next dev`, where react-leaflet 4 crashes pub pages under strict mode.
const againstDevServer = !process.env.CI && !process.env.PLAYWRIGHT_BASE_URL && !process.env.PLAYWRIGHT_WEB_SERVER_COMMAND

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
    test.skip(againstDevServer, 'hydration is only meaningful against a production build')

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
