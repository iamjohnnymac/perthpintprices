#!/usr/bin/env node
/**
 * Throwaway: builds paginated contact sheets (public/photo-review/page-N.html) — a
 * labelled grid of the downloaded pub photos, ~24 per page so each loads fast enough
 * to screenshot. Reads the manifest written by download-review-photos.mjs. The .jpgs
 * are expected to already be in public/photo-review/. Safe to delete.
 */
import { readFile, writeFile } from 'fs/promises'

const PER_PAGE = 24
const OUT = 'public/photo-review'

const rows = (await readFile('.photo-review/manifest.tsv', 'utf8'))
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('\t'))

const pages = Math.ceil(rows.length / PER_PAGE)

for (let pg = 0; pg < pages; pg++) {
  const slice = rows.slice(pg * PER_PAGE, (pg + 1) * PER_PAGE)
  const cells = slice
    .map(([idx, name, suburb]) => `
      <figure style="margin:0">
        <img src="${idx}.jpg" loading="eager" style="width:100%;height:160px;object-fit:cover;border:2px solid #171717;display:block">
        <figcaption style="font:11px/1.3 monospace;padding:3px 0 0">${idx} · ${name || ''}${suburb ? ` <span style="color:#8A8A85">${suburb}</span>` : ''}</figcaption>
      </figure>`)
    .join('')
  const html = `<!doctype html><meta charset="utf8"><title>Photos ${pg + 1}/${pages}</title>
<body style="margin:10px;background:#FDF8F0;font-family:monospace">
<div style="font:bold 13px monospace;margin-bottom:8px">Page ${pg + 1} / ${pages} — photos ${slice[0][0]}–${slice[slice.length - 1][0]}</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${cells}</div>
</body>`
  await writeFile(`${OUT}/page-${pg}.html`, html)
}

console.log(`built ${pages} pages (${PER_PAGE}/page) for ${rows.length} photos -> ${OUT}/page-0.html …`)
