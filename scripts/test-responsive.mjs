#!/usr/bin/env node
/**
 * Quick responsive test - loads localhost:3000 and checks key elements at mobile/tablet/desktop widths
 */
import { firefox } from '@playwright/test'

const BASE = 'http://localhost:3000'
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1200, height: 800 },
]

async function run() {
  const browser = await firefox.launch({ headless: true })
  const page = await browser.newPage()

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 10000 })

    // Wait for main content (past loading skeleton)
    await page.waitForSelector('main.min-h-screen', { timeout: 5000 })
    await page.waitForTimeout(3000) // Let React hydrate + data load

    const results = []
    const checks = [
      { sel: 'header', label: 'Header' },
      { sel: '[data-submit-trigger], button:has-text("Submit")', label: 'Submit button' },
      { sel: 'select', label: 'Suburb select' },
      { sel: 'button:has-text("Cheapest")', label: 'Cheapest button' },
      { sel: 'button:has-text("Nearest"), button:has-text("Near Me")', label: 'Nearest button' },
      { sel: 'section', label: 'HowItWorks section' },
    ]

    for (const { sel, label } of checks) {
      try {
        const el = await page.locator(sel).first()
        const count = await el.count()
        const visible = count > 0 ? await el.isVisible() : false
        let box = null
        if (visible) {
          box = await el.boundingBox()
        }
        results.push({
          label,
          found: count > 0,
          visible,
          ...(box && { top: Math.round(box.y), left: Math.round(box.x), w: Math.round(box.width), h: Math.round(box.height) }),
        })
      } catch (e) {
        results.push({ label, found: false, visible: false, error: e.message })
      }
    }

    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`)
    for (const r of results) {
      const status = r.visible ? '✓' : r.found ? '○' : '✗'
      const dims = r.w ? ` @ ${r.left},${r.top} ${r.w}x${r.h}` : ''
      console.log(`  ${status} ${r.label}${dims}`)
    }
  }

  await browser.close()
  console.log('\nDone.')
}

run().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
