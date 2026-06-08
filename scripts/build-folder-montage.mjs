#!/usr/bin/env node
/**
 * Throwaway: builds ONE labelled montage per slug showing ALL its candidates
 * (index numbers large), so a human can pick the right index. Slugs passed as args.
 * Output: .photo-candidates/_verify/folder-<slug>.jpg   Uses @napi-rs/canvas.
 */
import { mkdir } from 'fs/promises'
import { readdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

try { GlobalFonts.registerFromPath('C:\\Windows\\Fonts\\arialbd.ttf', 'ArialBd') } catch {}

const slugs = process.argv.slice(2)
if (!slugs.length) { console.error('usage: node scripts/build-folder-montage.mjs slug1 slug2 ...'); process.exit(1) }
await mkdir('.photo-candidates/_verify', { recursive: true })

const COLS = 3, CW = 360, IMGH = 220, LBL = 30, CH = IMGH + LBL

for (const slug of slugs) {
  const dir = `.photo-candidates/${slug}`
  if (!existsSync(dir)) { console.log(`! ${slug}: no folder`); continue }
  const files = readdirSync(dir).filter((f) => /^\d\d\.jpg$/.test(f)).sort()
  if (!files.length) { console.log(`! ${slug}: no candidates`); continue }
  const rows = Math.ceil(files.length / COLS)
  const W = COLS * CW, H = rows * CH
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FDF8F0'; ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < files.length; i++) {
    const col = i % COLS, row = Math.floor(i / COLS)
    const x = col * CW, y = row * CH
    try {
      const img = await loadImage(`${dir}/${files[i]}`)
      const bw = CW - 8, bh = IMGH - 4
      const scale = Math.min(bw / img.width, bh / img.height)
      const w = img.width * scale, h = img.height * scale
      ctx.fillStyle = '#000'; ctx.fillRect(x + 4, y + 2, bw, bh)
      ctx.drawImage(img, x + 4 + (bw - w) / 2, y + 2 + (bh - h) / 2, w, h)
    } catch { ctx.fillStyle = '#900'; ctx.fillRect(x + 4, y + 2, CW - 8, IMGH - 4) }
    ctx.fillStyle = '#D4740A'; ctx.font = '22px ArialBd'
    ctx.fillText(`#${files[i].replace('.jpg', '')}`, x + 8, y + IMGH + 22)
  }
  const out = `.photo-candidates/_verify/folder-${slug}.jpg`
  await writeFile(out, await canvas.encode('jpeg', 90))
  console.log(`built ${out} (${files.length} candidates)`)
}
