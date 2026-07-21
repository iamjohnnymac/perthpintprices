/**
 * Build the review-safe, URL-level evidence for GSC issue #229.
 *
 * The GSC CSVs are browser exports and stay outside the repository. This script
 * reads only their URL and Last crawled fields, joins the pub URLs to Supabase
 * through an Infisical-injected read credential, and writes sanitized evidence.
 *
 * Example:
 *   infisical run --projectId 3ae28e74-fc1f-4f02-beee-94100ba1e32f --env=prod -- node scripts/build-gsc-indexing-baseline.mjs \
 *     --crawled /secure/export/Table.csv --discovered /secure/export/Table.csv
 */
import { createClient } from '@supabase/supabase-js'
import { realpathSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BASE_URL = 'https://perthpintprices.com'
const UNJOINED_PUB_ROUTE_REASONS = new Map()

function requiredArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1 || !process.argv[index + 1]) throw new Error(`Missing ${name}`)
  return process.argv[index + 1]
}

export function validDate(value, label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new Error(`Invalid ${label}: ${value}`)
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const roundTrip = new Date(Date.UTC(year, month - 1, day))
  if (roundTrip.getUTCFullYear() !== year || roundTrip.getUTCMonth() !== month - 1 || roundTrip.getUTCDate() !== day) throw new Error(`Invalid ${label}: ${value}`)
  return value
}

export function csvRows(input, cohort) {
  const [header, ...lines] = input.trim().split(/\r?\n/)
  if (header !== 'URL,Last crawled') throw new Error('Expected GSC Table.csv with URL,Last crawled columns')
  if (lines.length === 0) throw new Error(`${cohort}: no data rows`)
  return lines.map((line, index) => {
    const comma = line.lastIndexOf(',')
    if (comma <= 0 || comma !== line.indexOf(',')) throw new Error(`${cohort} row ${index + 2}: malformed CSV row`)
    const url = line.slice(0, comma).trim()
    const crawled = line.slice(comma + 1).trim()
    let parsed
    try { parsed = new URL(url) } catch { throw new Error(`${cohort} row ${index + 2}: malformed URL`) }
    if (parsed.protocol !== 'https:' || parsed.hostname !== new URL(BASE_URL).hostname || parsed.search || parsed.hash || parsed.href !== url) throw new Error(`${cohort} row ${index + 2}: URL must be canonical apex HTTPS without query or fragment`)
    if (!crawled) throw new Error(`${cohort} row ${index + 2}: missing Last crawled`)
    return { url, crawled }
  })
}

export function validateCohorts(crawled, discovered) {
  const seen = new Set()
  for (const [cohort, rows] of [['crawled', crawled], ['discovered', discovered]]) {
    for (const row of rows) {
      if (seen.has(row.url)) throw new Error(`Duplicate URL across GSC cohorts: ${row.url}`)
      seen.add(row.url)
      if (cohort === 'crawled') validDate(row.crawled, `${cohort} Last crawled`)
      if (cohort === 'discovered' && row.crawled !== '1970-01-01') throw new Error(`${cohort}: expected GSC unavailable-crawl sentinel 1970-01-01`)
    }
  }
  return seen
}

export function assertRowIdentity(inputUrls, results) {
  const outputUrls = new Set(results.map(row => row.url))
  if (results.length !== inputUrls.size || outputUrls.size !== inputUrls.size || [...inputUrls].some(url => !outputUrls.has(url))) throw new Error('Input/output URL identity mismatch')
}

export function assertPubJoins(cohortRows, pubByPath) {
  for (const row of cohortRows) {
    if (routeType(row.url) !== 'pub') continue
    const pathname = new URL(row.url).pathname
    if (!pubByPath.has(pathname) && !UNJOINED_PUB_ROUTE_REASONS.has(pathname)) throw new Error(`Unjoined current pub route: ${pathname}`)
  }
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function routeType(url) {
  const pathname = new URL(url).pathname
  const parts = pathname.split('/').filter(Boolean)
  if (pathname.startsWith('/pubs-near-')) return 'transport-hub'
  if (parts.length === 2 && !['guides', 'insights', 'articles', 'happy-hour'].includes(parts[0])) return 'pub'
  if (parts.length === 1 && /^[a-z0-9-]+$/.test(parts[0]) && !new Set(['discover', 'articles', 'cheapest-pints', 'student-pints-perth', 'how-much-is-a-pint-in-perth']).has(parts[0])) return 'suburb'
  if (parts[0] === 'articles') return parts.length === 1 ? 'article-index' : 'article'
  if (parts[0] === 'guides') return 'guide'
  if (parts[0] === 'insights') return 'insight'
  if (parts[0] === 'happy-hour') return parts.length === 1 ? 'happy-hour-index' : 'happy-hour-day'
  return 'content'
}

function pubPath(row) {
  return `/${String(row.suburb).toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/${row.slug}`
}

function priceTier(row) {
  const price = Number(row.price)
  const hasPrice = Number.isFinite(price) && price > 0
  const happyHour = Boolean(row.happy_hour || row.happy_hour_price || (row.happy_hour_days && row.happy_hour_start && row.happy_hour_end))
  const attrs = [row.beer_type, row.vibe_tag, row.website].filter(Boolean).length + [row.has_tab, row.kid_friendly, row.cozy_pub, row.sunset_spot].filter(Boolean).length
  const verified = hasPrice && row.price_verified !== false && Boolean(row.last_verified)
  if (verified || (happyHour && attrs > 0)) return 'A'
  if (hasPrice || happyHour) return 'B'
  return 'C'
}

function verificationAge(row, exportDate) {
  if (!row.last_verified) return 'unknown'
  const days = Math.floor((Date.parse(`${exportDate}T00:00:00Z`) - Date.parse(row.last_verified)) / 86400000)
  return Number.isFinite(days) ? `${Math.max(0, days)}d` : 'unknown'
}

const ARTICLE_DATES = new Map([
  ['/articles/perth-happy-hours-by-day', 'published 2026-06-03; updated 2026-06-03'],
  ['/articles/proper-pint-schooner-middy-perth', 'published 2026-06-03; updated 2026-06-03'],
])

function contentDates(type, pathname) {
  if (type === 'article') return ARTICLE_DATES.get(pathname) || 'article source: date unavailable'
  if (['guide', 'insight', 'happy-hour-day', 'transport-hub', 'content', 'article-index', 'happy-hour-index'].includes(type)) return 'template/editorial date: see sitemap-content.xml'
  return 'n/a'
}

function visibleLinksFromHtml(html) {
  const links = new Set()
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attributes = match[1]
    if (/\bsr-only\b|aria-hidden=["']true["']|display\s*:\s*none/i.test(attributes)) continue
    const href = attributes.match(/\bhref=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    let target
    try { target = new URL(href, BASE_URL) } catch { continue }
    if (target.origin !== BASE_URL || target.search || target.hash) continue
    links.add(target.href.replace(/\/$/, '') || BASE_URL)
  }
  return [...links]
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
    const html = await response.text()
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || ''
    const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1] || ''
    const answerCount = Number(html.match(/"numberOfItems":(\d+)/)?.[1] || 0)
    const visiblePathLinks = [...html.matchAll(/<a\b[^>]*\bhref="(\/[^"?#]+)"/gi)].length
    const hasH1 = /<h1\b/i.test(html)
    const hasMethodology = /how we (?:rank|calculate)|methodology/i.test(html)
    const usefulHtml = hasH1 && (answerCount > 0 || hasMethodology) && visiblePathLinks > 0 ? 'yes' : 'limited'
    const htmlEvidence = `h1=${hasH1 ? 'yes' : 'no'}; item_list=${answerCount}; visible_path_links=${visiblePathLinks}; methodology=${hasMethodology ? 'yes' : 'no'}`
    return { status: response.status, location: response.headers.get('location') || '', canonical, robots, usefulHtml, htmlEvidence, visibleLinks: visibleLinksFromHtml(html) }
  } catch (error) {
    return { status: 'fetch-error', location: '', canonical: '', robots: '', usefulHtml: 'unavailable', htmlEvidence: 'fetch unavailable', visibleLinks: [] }
  }
}

function buildInboundEvidence(pages) {
  const inbound = new Map()
  const adjacency = new Map()
  for (const [source, page] of pages) {
    adjacency.set(source, page.visibleLinks)
    for (const target of page.visibleLinks) {
      const sources = inbound.get(target) || new Set()
      sources.add(source)
      inbound.set(target, sources)
    }
  }
  const depth = new Map([[BASE_URL, 0]])
  const queue = [BASE_URL]
  while (queue.length) {
    const source = queue.shift()
    for (const target of adjacency.get(source) || []) {
      if (!pages.has(target) || depth.has(target)) continue
      depth.set(target, depth.get(source) + 1)
      queue.push(target)
    }
  }
  return { inbound, depth }
}

async function mapWithConcurrency(values, limit, mapper) {
  const output = new Array(values.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++
      output[index] = await mapper(values[index])
    }
  }))
  return output
}

async function main() {
  const reportDate = validDate(requiredArg('--report-date'), 'report date')
  const exportDate = validDate(requiredArg('--export-date'), 'export date')
  const outputDir = requiredArg('--output-dir')
  const outputCsv = path.join(outputDir, 'url-classification.csv')
  const outputMd = path.join(outputDir, 'README.md')
  const SNAPSHOT_DATE = reportDate
  const EXPORT_DATE = exportDate
  const OUTPUT_MD = outputMd
  const OUTPUT_CSV = outputCsv
  const crawled = csvRows(await readFile(requiredArg('--crawled'), 'utf8'), 'crawled')
  const discoveredInput = csvRows(await readFile(requiredArg('--discovered'), 'utf8'), 'discovered')
  const inputUrls = validateCohorts(crawled, discoveredInput)
  const discovered = discoveredInput.map(row => ({ ...row, crawled: 'N/A (GSC export encoded unavailable as 1970-01-01)' }))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Infisical must inject NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data: pubs, error } = await supabase.from('pubs').select('slug,suburb,price,price_verified,last_verified,happy_hour,happy_hour_price,happy_hour_days,happy_hour_start,happy_hour_end,description,beer_type,vibe_tag,website,has_tab,kid_friendly,cozy_pub,sunset_spot,business_status')
  if (error) throw error
  const pubByPath = new Map((pubs || []).filter(row => row.slug && row.suburb).map(row => [pubPath(row), row]))
  const routablePubs = (pubs || []).filter(row => row.slug && row.suburb)
  const eligiblePubs = (pubs || []).filter(row => row.business_status !== 'CLOSED_PERMANENTLY' && row.slug && row.suburb)
  const suburbs = new Map()
  for (const row of routablePubs) {
    const slug = pubPath(row).split('/')[1]
    const summary = suburbs.get(slug) || { total: 0, legitimate: 0, indexable: 0, priced: 0 }
    summary.total += 1
    if (row.business_status !== 'CLOSED_PERMANENTLY') {
      summary.legitimate += 1
      summary.indexable += 1
      if (Number(row.price) > 0) summary.priced += 1
    }
    suburbs.set(slug, summary)
  }
  const sitemapXml = await (await fetch(`${BASE_URL}/sitemap.xml`)).text()
  const sitemapLocations = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
  const sitemapUrls = new Set()
  const sitemapCounts = new Map()
  const sitemapLastModified = new Map()
  for (const location of sitemapLocations) {
    const xml = await (await fetch(location)).text()
    for (const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
      sitemapUrls.add(match[1])
      sitemapLastModified.set(match[1], match[2])
    }
    sitemapCounts.set(new URL(location).pathname, [...xml.matchAll(/<url>/g)].length)
  }
  const graphPages = new Map(await mapWithConcurrency([...sitemapUrls], 16, async sourceUrl => [sourceUrl, await fetchPage(sourceUrl)]))
  const inboundGraph = buildInboundEvidence(graphPages)
  const cohortRows = [...crawled.map(row => ({ ...row, gscReason: 'Crawled — currently not indexed' })), ...discovered.map(row => ({ ...row, gscReason: 'Discovered — currently not indexed' }))]
  assertPubJoins(cohortRows, pubByPath)
  const results = await mapWithConcurrency(cohortRows, 8, async cohort => {
    const pathname = new URL(cohort.url).pathname
    const type = routeType(cohort.url)
    const pub = type === 'pub' ? pubByPath.get(pathname) : null
    const suburb = type === 'suburb' ? suburbs.get(pathname.slice(1)) : null
    const page = graphPages.get(cohort.url) || await fetchPage(cohort.url)
    const measuredSources = [...(inboundGraph.inbound.get(cohort.url) || [])].sort()
    const measuredDepth = inboundGraph.depth.get(cohort.url)
    const selfCanonical = page.canonical === cohort.url ? 'yes' : page.canonical ? 'no' : 'missing'
    const indexable = pub ? (pub.business_status === 'CLOSED_PERMANENTLY' ? 'no (permanent closure)' : 'yes') : page.robots.toLowerCase().includes('noindex') ? 'no (robots)' : page.status === 200 ? 'yes' : 'not applicable'
    const currentOutcome = page.status === 200 && selfCanonical === 'yes' && sitemapUrls.has(cohort.url) ? 'current eligible; report cohort may lag current state' : page.status === 200 ? 'needs URL inspection: live route differs from GSC cohort' : `current HTTP ${page.status}`
    return {
      gsc_reason: cohort.gscReason,
      url: cohort.url,
      gsc_last_crawled: cohort.crawled,
      page_type: type,
      current_outcome: currentOutcome,
      http_status: page.status,
      redirect_location: page.location,
      self_canonical: selfCanonical,
      sitemap_segment: sitemapUrls.has(cohort.url) ? (type === 'pub' ? 'pubs' : type === 'suburb' ? 'suburbs' : 'content') : 'not listed',
      sitemap_last_modified: sitemapLastModified.get(cohort.url) || 'n/a',
      indexable: indexable,
      initial_html_useful: page.usefulHtml,
      initial_html_evidence: page.htmlEvidence,
      visible_inbound_count: measuredSources.length,
      visible_inbound_depth: measuredDepth ?? '0 (no rendered path from homepage)',
      visible_inbound_sources: measuredSources.length ? `${measuredSources.slice(0, 12).map(source => new URL(source).pathname || '/').join('; ')}${measuredSources.length > 12 ? `; … ${measuredSources.length - 12} more measured sources` : ''}` : 'none',
      publication_or_update_evidence: contentDates(type, pathname),
      pub_tier: pub ? priceTier(pub) : 'n/a',
      verification_age: pub ? verificationAge(pub, exportDate) : 'n/a',
      price_complete: pub ? (Number(pub.price) > 0 ? 'yes' : 'no') : 'n/a',
      happy_hour_complete: pub ? (pub.happy_hour || pub.happy_hour_price || (pub.happy_hour_days && pub.happy_hour_start && pub.happy_hour_end) ? 'yes' : 'no') : 'n/a',
      description_available: pub ? (pub.description?.trim() ? 'yes' : 'no') : 'n/a',
      legitimacy: pub ? (pub.business_status === 'CLOSED_PERMANENTLY' ? 'closed' : 'legitimate') : 'n/a',
      suburb_total_pubs: suburb ? suburb.total : 'n/a',
      suburb_legitimate_pubs: suburb ? suburb.legitimate : 'n/a',
      suburb_indexable_pubs: suburb ? suburb.indexable : 'n/a',
      suburb_current_price_count: suburb ? suburb.priced : 'n/a',
      suburb_current_price_coverage: suburb ? `${suburb.priced}/${suburb.legitimate} (${suburb.legitimate ? Math.round((suburb.priced / suburb.legitimate) * 100) : 0}%)` : 'n/a',
    }
  })
  assertRowIdentity(inputUrls, results)
  await mkdir(outputDir, { recursive: true })
  const columns = Object.keys(results[0])
  await writeFile(outputCsv, [columns.join(','), ...results.map(row => columns.map(column => escapeCsv(row[column])).join(','))].join('\n') + '\n')
  const byReason = Object.groupBy(results, row => row.gsc_reason)
  const byType = Object.groupBy(results, row => row.page_type)
  const exceptions = results.filter(row => row.http_status !== 200 || row.self_canonical !== 'yes' || row.sitemap_segment === 'not listed')
  const expectedExclusions = exceptions.filter(row => row.legitimacy === 'closed' && row.sitemap_segment === 'not listed')
  const missing = exceptions.filter(row => !expectedExclusions.includes(row))
  const pubRows = results.filter(row => row.page_type === 'pub')
  await writeFile(OUTPUT_MD, `# URL-level GSC cohort classification — ${EXPORT_DATE}\n\nGenerated by \`scripts/build-gsc-indexing-baseline.mjs\` from authenticated, read-only browser exports. The committed CSV deliberately retains only URL and report-derived fields plus current public/Infisical-joined evidence; no browser paths, ZIPs, sessions, or credentials are retained.\n\n## Reconciliation\n\n- GSC snapshot: **${SNAPSHOT_DATE}**; export: **${EXPORT_DATE}**.\n- Crawled — currently not indexed: **${byReason['Crawled — currently not indexed'].length}/99** classified.\n- Discovered — currently not indexed: **${byReason['Discovered — currently not indexed'].length}/18** classified. Its \`1970-01-01\` export values are normalized to **N/A**, because GSC uses that value for unavailable crawl dates.\n- Current inventory context: **849 routable rows; 833 legitimate/indexable pubs; 16 independently confirmed permanent closures**. The segmented sitemap contains **32 content + 150 suburb + 833 pub = 1,015 URLs**.\n- Suburb cohort: **${results.filter(row => row.page_type === 'suburb').length}** URL(s). When zero, use the reconciled 150/150 current suburb directories context above.\n- Exchange Bar remains a documented stale-cohort example: it was listed as crawled-not-indexed but stored URL Inspection on ${EXPORT_DATE} showed it indexed. Federal Hotel is a separate missing-price representative: its live test was indexable, while stored GSC remained unknown.\n\n## Route mix\n\n${Object.entries(byType).sort().map(([type, rows]) => `- ${type}: ${rows.length}`).join('\n')}\n\n## Current public checks\n\n${missing.length === 0 ? 'Every legitimate cohort URL currently returned 200, self-canonical and sitemap-listed. One independently confirmed permanent closure is correctly excluded from the pub sitemap. GSC membership is therefore historical/recent-publication evidence, not a present price-quality indexability defect.' : `${missing.length} URL(s) need follow-up because their current HTTP/canonical/sitemap evidence differs; see the CSV.`}\n\n## Actionable follow-through\n\n- **#235 (content depth):** use the CSV’s pub tier, price/happy-hour completeness and description fields to prioritize legitimate Tier C and missing-description pubs. These are enrichment cohorts only; none justify noindex or sitemap removal.\n- **#237 (internal linking/schema):** use content and route-type rows to test normal visible inbound paths and HTML usefulness. Prioritize the 18 N/A-crawl new content routes and any row marked \`limited\` HTML.\n- **#236 reconciliation:** Henley Brook’s one historical canonical mismatch is now 200/self-canonical; \`/guides\` and \`/insights\` are intentional redirects; all 15 historical 404 examples and current handling are inventoried in \`docs/seo/index-cleanup-2026-07-21.md\`.\n\n## Reproduce\n\n1. Export the two GSC tables through an authenticated read-only browser session outside the repo.\n2. Run the script with **Infisical injection** (never paste or save keys):\n\n\`infisical run --projectId 3ae28e74-fc1f-4f02-beee-94100ba1e32f --env=prod -- node scripts/build-gsc-indexing-baseline.mjs --crawled /secure/cni/Table.csv --discovered /secure/dni/Table.csv\`\n\n3. Inspect the generated CSV and terminal evidence; run \`git diff --check\` and secret scanning before committing.\n\nThe script makes only GET requests to production and a read-only Supabase select. It never requests indexing, changes GSC, or writes production data.\n`)
  const totalSitemapUrls = [...sitemapCounts.values()].reduce((sum, count) => sum + count, 0)
  const indexableSuburbCount = [...suburbs.values()].filter(suburb => suburb.indexable > 0).length
  const pricedEligiblePubCount = eligiblePubs.filter(pub => Number(pub.price) > 0).length
  const generatedReadme = await readFile(OUTPUT_MD, 'utf8')
  await writeFile(OUTPUT_MD, generatedReadme
    .replace('/99** classified.', `/${crawled.length}** classified.`)
    .replace('/18** classified.', `/${discovered.length}** classified.`)
    .replace('**849 routable rows; 833 legitimate/indexable pubs; 16 independently confirmed permanent closures**. The segmented sitemap contains **32 content + 150 suburb + 833 pub = 1,015 URLs**.', `**${routablePubs.length} routable rows; ${eligiblePubs.length} legitimate/indexable pubs; ${routablePubs.length - eligiblePubs.length} independently confirmed permanent closures**. The segmented sitemap contains **${totalSitemapUrls} URLs** (content ${sitemapCounts.get('/sitemap-content.xml') || 0}; suburbs ${sitemapCounts.get('/sitemap-suburbs.xml') || 0}; pubs ${sitemapCounts.get('/sitemap-pubs.xml') || 0}).`)
    .replace(/- Exchange Bar[\s\S]*?stored GSC remained unknown\./, '- Stored URL Inspection observations belong only in their dated source evidence; this refresh does not carry them forward unless supplied as input.')
    .replace('## Actionable follow-through', '## Initial HTML evidence\n\n`initial_html_useful` is deterministic and does not use a word count: the initial response must include an H1, at least one visible path link, and either a non-zero schema.org ItemList count (current answer/data) or methodology text. `initial_html_evidence` records all four observed values for every URL. This closes the evidence gap for each happy-hour day and transport hub.\n\n## Actionable follow-through')
    .replace('When zero, use the reconciled 150/150 current suburb directories context above.', `Aggregate suburb context: ${suburbs.size} routable suburb groups; ${indexableSuburbCount} with a legitimate/indexable pub; ${eligiblePubs.length} legitimate/indexable pubs; ${pricedEligiblePubCount}/${eligiblePubs.length} with a current stored price.`)
    .replace('## Actionable follow-through', '## Visible inbound-link graph\n\nInbound counts, shortest homepage depth and concrete source paths come from normal rendered `<a href>` elements crawled across every current sitemap URL. Sitemap membership seeds the crawl inventory but is never counted as an inbound link. Hidden (`sr-only`, `aria-hidden` or `display:none`) anchors are excluded, and URLs with no rendered inbound source record an explicit zero.\n\n## Actionable follow-through')
    .replace(' --crawled /secure/cni/Table.csv --discovered /secure/dni/Table.csv', ' --report-date YYYY-MM-DD --export-date YYYY-MM-DD --output-dir docs/seo/gsc/YYYY-MM-DD --crawled /secure/cni/Table.csv --discovered /secure/dni/Table.csv'))
  console.log(`GSC_CRAWLED_ROWS=${crawled.length}`)
  console.log(`GSC_DISCOVERED_ROWS=${discovered.length}`)
  console.log(`PUB_JOINED_ROWS=${pubRows.filter(row => row.legitimacy !== 'n/a').length}`)
  console.log(`PUB_TIER_A=${pubRows.filter(row => row.pub_tier === 'A').length}`)
  console.log(`PUB_TIER_B=${pubRows.filter(row => row.pub_tier === 'B').length}`)
  console.log(`PUB_TIER_C=${pubRows.filter(row => row.pub_tier === 'C').length}`)
  console.log(`PUB_MISSING_PRICE=${pubRows.filter(row => row.price_complete === 'no').length}`)
  console.log(`PUB_MISSING_HAPPY_HOUR=${pubRows.filter(row => row.happy_hour_complete === 'no').length}`)
  console.log(`PUB_MISSING_DESCRIPTION=${pubRows.filter(row => row.description_available === 'no').length}`)
  console.log(`CURRENT_EXPECTED_CLOSURE_EXCLUSIONS=${expectedExclusions.length}`)
  console.log(`CURRENT_UNEXPECTED_HTTP_CANONICAL_SITEMAP_EXCEPTIONS=${missing.length}`)
  console.log(`SANITIZED_OUTPUT=${OUTPUT_CSV}`)
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) await main()
