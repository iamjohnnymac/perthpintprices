import { defineConfig, devices } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT || '3100'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
  || (process.env.CI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`)

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: process.env.CI
    ? [
      ['github'],
      ['list'],
      ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ]
    : [
      ['list'],
      ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: process.env.PLAYWRIGHT_VIDEO === 'on' ? 'on' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      command: webServerCommand,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    },
})
