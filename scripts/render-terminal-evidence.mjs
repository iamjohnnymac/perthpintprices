import { readFile, writeFile } from 'node:fs/promises'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) throw new Error('Usage: node scripts/render-terminal-evidence.mjs <input.txt> <output.html>')

const output = await readFile(inputPath, 'utf8')
const escaped = output
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

await writeFile(outputPath, `<!doctype html>
<meta charset="utf-8">
<title>Issue #236 terminal capture</title>
<style>
  body { margin: 0; background: #171717; color: #f7f7f5; }
  pre { box-sizing: border-box; margin: 0; min-height: 100vh; padding: 36px; font: 18px/1.55 Menlo, Monaco, monospace; white-space: pre-wrap; }
</style>
<pre>$ ROUTE_EVIDENCE_BASE_URL=&lt;PR preview&gt; ROUTE_EVIDENCE_APEX_URL=https://www.perthpintprices.com node scripts/capture-route-evidence.mjs

${escaped}</pre>`)
