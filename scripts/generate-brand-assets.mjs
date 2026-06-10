// Regenerates the brand image assets in public/:
//   og-image.png  1200x630 share card (every page's OG/Twitter image)
//   logo.png      1024x1024 brand logo (Organization JSON-LD / publisher logo)
//   icon-512.png, icon-192.png, apple-touch-icon.png (PWA + iOS icons)
//   favicon-*.png masters for favicon.ico (the .ico itself is assembled by
//                 scripts/build-favicon.py, run automatically below)
//
//   node scripts/generate-brand-assets.mjs
//
// Render is HTML + Playwright so the cards use the real site fonts/tokens.
// Re-run whenever the branding or the standing copy changes.
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const OUT = path.join(PUB, 'og-image.png')

// The header logo mark: white 8-spoke asterisk on amber.
const ASTERISK = (size, stroke) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" stroke-width="${stroke}" stroke-linecap="round"/></svg>`

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700;800&family=DM+Serif+Display:ital@1&family=Plus+Jakarta+Sans:wght@500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background: #FDF8F0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .topbar { height: 14px; background: #D4740A; }
  .card {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 96px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 44px;
  }
  .mark {
    width: 64px;
    height: 64px;
    background: #D4740A;
    border: 4px solid #171717;
    border-radius: 14px;
    box-shadow: 5px 5px 0 #171717;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-name {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 34px;
    letter-spacing: -0.04em;
    color: #171717;
  }
  h1 {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    font-size: 96px;
    letter-spacing: -0.05em;
    line-height: 1.02;
    color: #171717;
  }
  h1 .accent {
    font-family: 'DM Serif Display', serif;
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.01em;
    color: #D4740A;
  }
  .sub {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 500;
    font-size: 30px;
    color: #44443F;
    margin-top: 30px;
  }
  .pills { display: flex; gap: 16px; margin-top: 48px; }
  .pill {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 21px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #171717;
    background: #FFFFFF;
    border: 4px solid #171717;
    border-radius: 9999px;
    padding: 14px 30px;
    box-shadow: 4px 4px 0 #171717;
  }
  .pill.amber { background: #FFF3E0; }
</style>
</head>
<body>
  <div class="topbar"></div>
  <div class="card">
    <div class="brand">
      <div class="mark">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>
      </div>
      <div class="brand-name">Perth Pint Prices</div>
    </div>
    <h1>Perth&rsquo;s pints,<br><span class="accent">sorted.</span></h1>
    <p class="sub">Real pint prices across Perth&rsquo;s pubs &mdash; checked, dated, and sorted cheapest first.</p>
    <div class="pills">
      <div class="pill amber">Checked &amp; dated</div>
      <div class="pill">Cheapest first</div>
      <div class="pill">Free, no sign-up</div>
    </div>
  </div>
</body>
</html>`

// 1024x1024 brand logo for the Organization / publisher JSON-LD: the header
// mark + wordmark on the site background, legible at knowledge-panel sizes.
const logoHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1024px; height: 1024px; background: #FDF8F0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 72px; }
  .mark { width: 360px; height: 360px; background: #D4740A; border: 18px solid #171717; border-radius: 72px; box-shadow: 26px 26px 0 #171717; display: flex; align-items: center; justify-content: center; }
  .name { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 76px; letter-spacing: -0.04em; color: #171717; }
</style></head>
<body>
  <div class="mark">${ASTERISK(210, 2.5)}</div>
  <div class="name">Perth Pint Prices</div>
</body></html>`

// Full-bleed amber + asterisk for the PWA/iOS icons ("maskable" needs the
// artwork inside the centre safe zone, so the mark sits at ~55%).
const iconHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; }
  body { width: 1024px; height: 1024px; background: #D4740A; display: flex; align-items: center; justify-content: center; }
</style></head>
<body>${ASTERISK(560, 3)}</body></html>`

const browser = await chromium.launch()

async function shoot(markup, width, height, out) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.setContent(markup, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await page.screenshot({ path: out })
  await page.close()
  console.log(`written ${out}`)
}

await shoot(html, 1200, 630, OUT)
await shoot(logoHtml, 1024, 1024, path.join(PUB, 'logo.png'))
await shoot(iconHtml, 1024, 1024, path.join(PUB, 'icon-master.png'))
await browser.close()

// Downscale the icon master + assemble favicon.ico (Pillow).
execFileSync('python3', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'build-favicon.py')], { stdio: 'inherit' })
