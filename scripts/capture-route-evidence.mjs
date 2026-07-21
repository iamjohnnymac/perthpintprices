import assert from 'node:assert/strict'

const baseUrl = process.env.ROUTE_EVIDENCE_BASE_URL
const apexUrl = process.env.ROUTE_EVIDENCE_APEX_URL

if (!baseUrl || !apexUrl) {
  throw new Error('Set ROUTE_EVIDENCE_BASE_URL and ROUTE_EVIDENCE_APEX_URL')
}

const redirects = [
  ['/midland/the-7th-ave-bar-and-restaurant', 301, '/midland/7th-ave-bar-and-restaurant'],
  ['/northbridge/i-darts-nix-perth', 301, '/northbridge/idartsnix'],
  ['/scarborough/sk-l', 301, '/scarborough/skol'],
  ['/perth-cbd/helvetica-bar', 301, '/perth/399-small-bar'],
  ['/henley-brook/the-naked-fox-wine-bar', 301, '/henley-brook/the-naked-fox-wine-bar-kitchen-and-caf'],
  ['/guides', 301, '/discover'],
  ['/insights', 301, '/discover'],
  ['/suburb/north-perth', 301, '/north-perth'],
]

const fixedResponses = [
  ['/pub/badlands-bar', 410],
  ['/pub/jack-rabbit-slims', 410],
  ['/pub/w-churchill', 410],
  ['/pub/wolf-lane', 410],
  ['/pub/ruin-bar', 410],
  ['/pub/the-flying-scotsman', 410],
  ['/northbridge/ruin-bar', 404],
  ['/mount-lawley/five-bar', 404],
  ['/perth-cbd/halford-bar', 404],
  ['/pub-golf', 404],
]

async function checkResponse(path, expectedStatus, expectedLocation) {
  const response = await fetch(new URL(path, baseUrl), { redirect: 'manual' })
  const location = response.headers.get('location') ?? '-'
  assert.equal(response.status, expectedStatus, `${path} status`)
  if (expectedLocation) assert.equal(location, expectedLocation, `${path} location`)
  console.log(`${path}\t${response.status}\t${location}`)
}

console.log(`BASE\t${baseUrl}`)
console.log('PATH\tSTATUS\tLOCATION_OR_CANONICAL')
for (const [path, status, location] of redirects) await checkResponse(path, status, location)
for (const [path, status] of fixedResponses) await checkResponse(path, status)

const henleyBrook = await fetch(new URL('/henley-brook/the-henley-brook', baseUrl), { redirect: 'manual' })
const henleyBrookHtml = await henleyBrook.text()
const canonical = henleyBrookHtml.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
const title = henleyBrookHtml.match(/<title>([^<]+)<\/title>/)?.[1]
assert.equal(henleyBrook.status, 200, 'Henley Brook status')
assert.equal(canonical, 'https://perthpintprices.com/henley-brook/the-henley-brook', 'Henley Brook canonical')
assert.match(title ?? '', /^The Henley Brook, Henley Brook:/, 'Henley Brook title')
console.log(`/henley-brook/the-henley-brook\t${henleyBrook.status}\t${canonical}\t${title}`)

const www = await fetch(new URL('/suburb/north-perth', apexUrl), { redirect: 'manual' })
const wwwLocation = www.headers.get('location') ?? '-'
assert.ok([301, 308].includes(www.status), 'www apex redirect must be permanent')
assert.equal(wwwLocation, 'https://perthpintprices.com/suburb/north-perth', 'www apex redirect location')
console.log(`www:/suburb/north-perth\t${www.status}\t${wwwLocation}`)

console.log('RESULT\tPASS')
