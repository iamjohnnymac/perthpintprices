const baseUrl = process.env.SITEMAP_VALIDATION_BASE_URL || 'http://127.0.0.1:3000'
const expectedLegitimatePubCount = 833
const concurrency = 12

function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
}

function localUrl(url) {
  const parsed = new URL(url)
  return new URL(`${parsed.pathname}${parsed.search}`, baseUrl).toString()
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? ''
}

function robotsDirectives(response, html) {
  const header = response.headers.get('x-robots-tag') ?? ''
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .filter(match => attribute(match[0], 'name').toLowerCase() === 'robots')
    .map(match => attribute(match[0], 'content'))
  return [header, ...meta].join(',').toLowerCase()
}

function blocksIndexing(directives) {
  return /(^|[\s,;])(?:noindex|nofollow)(?=$|[\s,;])/.test(directives)
}

async function getText(url) {
  const response = await fetch(url, { redirect: 'manual' })
  return { response, text: await response.text() }
}

const { response: indexResponse, text: indexXml } = await getText(`${baseUrl}/sitemap.xml`)
if (indexResponse.status !== 200) throw new Error(`Sitemap index returned ${indexResponse.status}`)
const sitemapUrls = locations(indexXml)
if (sitemapUrls.length !== 3) throw new Error(`Expected three child sitemaps, found ${sitemapUrls.length}`)

const inventories = await Promise.all(sitemapUrls.map(async sitemapUrl => {
  const { response, text } = await getText(localUrl(sitemapUrl))
  if (response.status !== 200) throw new Error(`${sitemapUrl} returned ${response.status}`)
  if (!response.headers.get('content-type')?.includes('application/xml')) throw new Error(`${sitemapUrl} did not return XML`)
  return { sitemapUrl, urls: locations(text) }
}))

const allUrls = inventories.flatMap(inventory => inventory.urls)
const duplicates = allUrls.filter((url, index) => allUrls.indexOf(url) !== index)
const prohibited = allUrls.filter(url => /\/(admin|api|signal)(\/|$)|\/world-cup$|\/(guides|insights)$/.test(url))
const pubInventory = inventories.find(inventory => inventory.sitemapUrl.endsWith('/sitemap-pubs.xml'))
if (!pubInventory) throw new Error('Pub sitemap is missing')
if (pubInventory.urls.length !== expectedLegitimatePubCount) {
  throw new Error(`Expected ${expectedLegitimatePubCount} legitimate pub URLs, found ${pubInventory.urls.length}`)
}
if (duplicates.length || prohibited.length) throw new Error(`Duplicate URLs: ${duplicates.length}; prohibited URLs: ${prohibited.length}`)

let cursor = 0
const failures = []
const robotsFailures = []
async function worker() {
  while (cursor < allUrls.length) {
    const index = cursor++
    const canonicalUrl = allUrls[index]
    try {
      const { response, text } = await getText(localUrl(canonicalUrl))
      const canonical = text.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]
      if (response.status !== 200 || canonical !== canonicalUrl) {
        failures.push(`${canonicalUrl}\tstatus=${response.status}\tcanonical=${canonical || 'missing'}`)
      }
      const directives = robotsDirectives(response, text)
      if (blocksIndexing(directives)) {
        robotsFailures.push(`${canonicalUrl}\tdirectives=${directives}`)
      }
    } catch (error) {
      failures.push(`${canonicalUrl}\terror=${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker))

console.log(`SITEMAP_INDEX_STATUS\t${indexResponse.status}`)
for (const inventory of inventories) console.log(`SITEMAP_URLS\t${inventory.sitemapUrl}\t${inventory.urls.length}`)
console.log(`LEGITIMATE_PUB_URLS\t${pubInventory.urls.length}`)
console.log(`TOTAL_SITEMAP_URLS\t${allUrls.length}`)
console.log(`DUPLICATE_URLS\t${duplicates.length}`)
console.log(`PROHIBITED_URLS\t${prohibited.length}`)
console.log(`ROUTE_OR_CANONICAL_FAILURES\t${failures.length}`)
console.log(`ROBOTS_DIRECTIVE_FAILURES\t${robotsFailures.length}`)
for (const failure of failures.slice(0, 20)) console.log(`FAILURE\t${failure}`)
for (const failure of robotsFailures.slice(0, 20)) console.log(`ROBOTS_FAILURE\t${failure}`)
process.exit(failures.length || robotsFailures.length ? 1 : 0)
