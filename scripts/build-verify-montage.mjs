#!/usr/bin/env node
/**
 * Throwaway: builds labelled montage sheets (JPG) of the CHOSEN candidate per pub
 * from scripts/recurated-picks.json so the picks can be eyeballed in a few grids.
 * Uses @napi-rs/canvas (no system deps). Output: .photo-candidates/_verify/sheet-N.jpg
 * Safe to delete.
 */
import { readFile, mkdir, rm, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

try { GlobalFonts.registerFromPath('C:\\Windows\\Fonts\\arialbd.ttf', 'ArialBd') } catch {}
try { GlobalFonts.registerFromPath('C:\\Windows\\Fonts\\arial.ttf', 'Arial') } catch {}

const picks = JSON.parse(await readFile('scripts/recurated-picks.json', 'utf8'))
const VER = '.photo-candidates/_verify'
await rm(VER, { recursive: true, force: true })
await mkdir(VER, { recursive: true })

const items = []
const missing = []
for (const [slug, val] of Object.entries(picks)) {
  if (val === 'NONE') continue
  const nn = String(val).padStart(2, '0')
  const src = `.photo-candidates/${slug}/${nn}.jpg`
  if (!existsSync(src)) { missing.push(`${slug}#${nn}`); continue }
  items.push({ slug, nn, src })
}
if (missing.length) console.log('MISSING picked files:', missing.join(', '))

const COLS = 3, ROWS = 5, PER = COLS * ROWS
const CW = 360, IMGH = 215, LBL = 28, CH = IMGH + LBL
const W = COLS * CW, H = ROWS * CH

const sheets = Math.ceil(items.length / PER)
for (let s = 0; s < sheets; s++) {
  const batch = items.slice(s * PER, (s + 1) * PER)
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FDF8F0'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < batch.length; i++) {
    const col = i % COLS, row = Math.floor(i / COLS)
    const x = col * CW, y = row * CH
    try {
      const img = await loadImage(batch[i].src)
      // contain within (CW-8) x IMGH
      const bw = CW - 8, bh = IMGH - 4
      const scale = Math.min(bw / img.width, bh / img.height)
      const w = img.width * scale, h = img.height * scale
      ctx.fillStyle = '#000'
      ctx.fillRect(x + 4, y + 2, bw, bh)
      ctx.drawImage(img, x + 4 + (bw - w) / 2, y + 2 + (bh - h) / 2, w, h)
    } catch (e) {
      ctx.fillStyle = '#900'; ctx.fillRect(x + 4, y + 2, CW - 8, IMGH - 4)
    }
    ctx.fillStyle = '#171717'
    ctx.font = '15px ArialBd'
    let label = `${batch[i].slug}  [${batch[i].nn}]`
    while (ctx.measureText(label).width > CW - 10 && label.length > 6) label = label.slice(0, -1)
    ctx.fillText(label, x + 5, y + IMGH + 18)
  }
  const buf = await canvas.encode('jpeg', 88)
  const out = `${VER}/sheet-${s}.jpg`
  await writeFile(out, buf)
  console.log(`built ${out} (${batch.length} picks)`)
}
console.log(`\n${items.length} picks across ${sheets} sheets`)
