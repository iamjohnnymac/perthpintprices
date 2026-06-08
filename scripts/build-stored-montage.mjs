#!/usr/bin/env node
/**
 * Throwaway: montage of the ACTUALLY-STORED photos downloaded by verify-applied.mjs
 * (.photo-candidates/_verify-<slug>.jpg) so the stored result can be confirmed against
 * the intended pick. Uses @napi-rs/canvas. Output: .photo-candidates/_verify/stored-N.jpg
 */
import { readdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
try { GlobalFonts.registerFromPath('C:\\Windows\\Fonts\\arialbd.ttf', 'ArialBd') } catch {}

const files = readdirSync('.photo-candidates')
  .filter((f) => f.startsWith('_verify-') && f.endsWith('.jpg'))
  .map((f) => ({ slug: f.replace(/^_verify-/, '').replace(/\.jpg$/, ''), path: `.photo-candidates/${f}` }))

const COLS = 3, ROWS = 5, PER = COLS * ROWS
const CW = 360, IMGH = 215, LBL = 28, CH = IMGH + LBL
const sheets = Math.ceil(files.length / PER)
for (let s = 0; s < sheets; s++) {
  const batch = files.slice(s * PER, (s + 1) * PER)
  const W = COLS * CW, H = ROWS * CH
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FDF8F0'; ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < batch.length; i++) {
    const col = i % COLS, row = Math.floor(i / COLS), x = col * CW, y = row * CH
    try {
      const img = await loadImage(batch[i].path)
      const bw = CW - 8, bh = IMGH - 4
      const scale = Math.min(bw / img.width, bh / img.height)
      const w = img.width * scale, h = img.height * scale
      ctx.fillStyle = '#000'; ctx.fillRect(x + 4, y + 2, bw, bh)
      ctx.drawImage(img, x + 4 + (bw - w) / 2, y + 2 + (bh - h) / 2, w, h)
    } catch { ctx.fillStyle = '#900'; ctx.fillRect(x + 4, y + 2, CW - 8, IMGH - 4) }
    ctx.fillStyle = '#171717'; ctx.font = '15px ArialBd'
    let label = batch[i].slug
    while (ctx.measureText(label).width > CW - 10 && label.length > 6) label = label.slice(0, -1)
    ctx.fillText(label, x + 5, y + IMGH + 18)
  }
  const out = `.photo-candidates/_verify/stored-${s}.jpg`
  await writeFile(out, await canvas.encode('jpeg', 90))
  console.log(`built ${out} (${batch.length})`)
}
