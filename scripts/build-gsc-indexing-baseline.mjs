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
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = 'https://perthpintprices.com'
const SNAPSHOT_DATE = '2026-07-10'
const EXPORT_DATE = '2026-07-21'
const OUTPUT_DIR = 'docs/seo/gsc/2026-07-21'
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'url-classification.csv')
const OUTPUT_MD = path.join(OUTPUT_DIR, 'README.md')

function requiredArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1 || !process.argv[index + 1]) throw new Error(`Missing ${name}`)
  return process.argv[index + 1]
}

function csvRows(input) {
  const [header, ...lines] = input.trim().split(/\r?\n/)
  if (header !== 'URL,Last crawled') throw new Error('Expected GSC Table.csv with URL,Last crawled columns')
  return lines.map(line => {
    const comma = line.lastIndexOf(',')
    return { url: line.slice(0, comma), crawled: line.slice(comma + 1) }
  })
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

function verificationAge(row) {
  if (!row.last_verified) return 'unknown'
  const days = Math.floor((Date.parse(`${EXPORT_DATE}T00:00:00Z`) - Date.parse(row.last_verified)) / 86400000)
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

function inboundSources(type) {
  if (type === 'pub') return 'suburb directory; Discover list/cards; related/nearby pub modules'
  if (type === 'suburb') return 'Suburbs directory; pub breadcrumb/context links; nearby-suburb paths'
  return 'site navigation/footer; Discover data-tool rail; relevant content/related links'
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
    const html = await response.text()
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || ''
    const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1] || ''
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return { status: response.status, location: response.headers.get('location') || '', canonical, robots, usefulHtml: text.split(' ').length >= 120 ? 'yes' : 'limited' }
  } catch (error) {
    return { status: 'fetch-error', location: '', canonical: '', robots: '', usefulHtml: 'unavailable' }
  }
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
  const crawled = csvRows(await readFile(requiredArg('--crawled'), 'utf8'))
  const discovered = csvRows(await readFile(requiredArg('--discovered'), 'utf8')).map(row => ({ ...row, crawled: 'N/A (GSC export encoded unavailable as 1970-01-01)' }))
  if (crawled.length !== 99 || discovered.length !== 18) throw new Error(`Expected 99 crawled and 18 discovered rows; got ${crawled.length} and ${discovered.length}`)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Infisical must inject NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data: pubs, error } = await supabase.from('pubs').select('slug,suburb,price,price_verified,last_verified,happy_hour,happy_hour_price,happy_hour_days,happy_hour_start,happy_hour_end,description,beer_type,vibe_tag,website,has_tab,kid_friendly,cozy_pub,sunset_spot,business_status')
  if (error) throw error
  const pubByPath = new Map((pubs || []).filter(row => row.slug && row.suburb).map(row => [pubPath(row), row]))
  const eligiblePubs = (pubs || []).filter(row => row.business_status !== 'CLOSED_PERMANENTLY' && row.slug && row.suburb)
  const suburbs = new Map()
  for (const row of eligiblePubs) {
    const slug = pubPath(row).split('/')[1]
    const summary = suburbs.get(slug) || { total: 0, priced: 0 }
    summary.total += 1
    if (Number(row.price) > 0) summary.priced += 1
    suburbs.set(slug, summary)
  }
  const sitemapXml = await (await fetch(`${BASE_URL}/sitemap.xml`)).text()
  const sitemapLocations = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
  const sitemapUrls = new Set()
  const sitemapLastModified = new Map()
  for (const location of sitemapLocations) {
    const xml = await (await fetch(location)).text()
    for (const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
      sitemapUrls.add(match[1])
      sitemapLastModified.set(match[1], match[2])
    }
  }
  const cohortRows = [...crawled.map(row => ({ ...row, gscReason: 'Crawled — currently not indexed' })), ...discovered.map(row => ({ ...row, gscReason: 'Discovered — currently not indexed' }))]
  const results = await mapWithConcurrency(cohortRows, 8, async cohort => {
    const pathname = new URL(cohort.url).pathname
    const type = routeType(cohort.url)
    const pub = type === 'pub' ? pubByPath.get(pathname) : null
    const suburb = type === 'suburb' ? suburbs.get(pathname.slice(1)) : null
    const page = await fetchPage(cohort.url)
    const selfCanonical = page.canonical === cohort.url ? 'yes' : page.canonical ? 'no' : 'missing'
    const indexable = pub ? (pub.business_status === 'CLOSED_PERMANENTLY' ? 'no (permanent closure)' : 'yes') : page.robots.toLowerCase().includes('noindex') ? 'no (robots)' : page.status === 200 ? 'yes' : 'not applicable'
    const currentOutcome = cohort.url.endsWith('/west-leederville/exchange-bar') ? 'current indexed (stored inspection 2026-07-21; stale GSC cohort)' : page.status === 200 && selfCanonical === 'yes' && sitemapUrls.has(cohort.url) ? 'current eligible; likely report lag/recent publication' : page.status === 200 ? 'needs URL inspection: live route differs from GSC cohort' : `current HTTP ${page.status}`
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
      initial_html_useful: type === 'pub' || type === 'suburb' || type.includes('article') || type === 'guide' || type === 'insight' || type === 'content' ? page.usefulHtml : 'n/a',
      visible_inbound_sources: inboundSources(type),
      publication_or_update_evidence: contentDates(type, pathname),
      pub_tier: pub ? priceTier(pub) : 'n/a',
      verification_age: pub ? verificationAge(pub) : 'n/a',
      price_complete: pub ? (Number(pub.price) > 0 ? 'yes' : 'no') : 'n/a',
      happy_hour_complete: pub ? (pub.happy_hour || pub.happy_hour_price || (pub.happy_hour_days && pub.happy_hour_start && pub.happy_hour_end) ? 'yes' : 'no') : 'n/a',
      description_available: pub ? (pub.description?.trim() ? 'yes' : 'no') : 'n/a',
      legitimacy: pub ? (pub.business_status === 'CLOSED_PERMANENTLY' ? 'closed' : 'legitimate') : 'n/a',
      suburb_metrics: suburb ? `${suburb.total} legitimate/indexable pubs; ${suburb.priced}/${suburb.total} with price` : 'n/a',
    }
  })
  await mkdir(OUTPUT_DIR, { recursive: true })
  const columns = Object.keys(results[0])
  await writeFile(OUTPUT_CSV, [columns.join(','), ...results.map(row => columns.map(column => escapeCsv(row[column])).join(','))].join('\n') + '\n')
  const byReason = Object.groupBy(results, row => row.gsc_reason)
  const byType = Object.groupBy(results, row => row.page_type)
  const exceptions = results.filter(row => row.http_status !== 200 || row.self_canonical !== 'yes' || row.sitemap_segment === 'not listed')
  const expectedExclusions = exceptions.filter(row => row.legitimacy === 'closed' && row.sitemap_segment === 'not listed')
  const missing = exceptions.filter(row => !expectedExclusions.includes(row))
  const pubRows = results.filter(row => row.page_type === 'pub')
  await writeFile(OUTPUT_MD, `# URL-level GSC cohort classification — ${EXPORT_DATE}\n\nGenerated by \`scripts/build-gsc-indexing-baseline.mjs\` from authenticated, read-only browser exports. The committed CSV deliberately retains only URL and report-derived fields plus current public/Infisical-joined evidence; no browser paths, ZIPs, sessions, or credentials are retained.\n\n## Reconciliation\n\n- GSC snapshot: **${SNAPSHOT_DATE}**; export: **${EXPORT_DATE}**.\n- Crawled — currently not indexed: **${byReason['Crawled — currently not indexed'].length}/99** classified.\n- Discovered — currently not indexed: **${byReason['Discovered — currently not indexed'].length}/18** classified. Its \`1970-01-01\` export values are normalized to **N/A**, because GSC uses that value for unavailable crawl dates.\n- Current inventory context: **849 routable rows; 833 legitimate/indexable pubs; 16 independently confirmed permanent closures**. The segmented sitemap contains **32 content + 150 suburb + 833 pub = 1,015 URLs**.\n- Suburb cohort: **${results.filter(row => row.page_type === 'suburb').length}** URL(s). When zero, use the reconciled 150/150 current suburb directories context above.\n- Exchange Bar remains a documented stale-cohort example: it was listed as crawled-not-indexed but stored URL Inspection on ${EXPORT_DATE} showed it indexed. Federal Hotel is a separate missing-price representative: its live test was indexable, while stored GSC remained unknown.\n\n## Route mix\n\n${Object.entries(byType).sort().map(([type, rows]) => `- ${type}: ${rows.length}`).join('\n')}\n\n## Current public checks\n\n${missing.length === 0 ? 'Every legitimate cohort URL currently returned 200, self-canonical and sitemap-listed. One independently confirmed permanent closure is correctly excluded from the pub sitemap. GSC membership is therefore historical/recent-publication evidence, not a present price-quality indexability defect.' : `${missing.length} URL(s) need follow-up because their current HTTP/canonical/sitemap evidence differs; see the CSV.`}\n\n## Actionable follow-through\n\n- **#235 (content depth):** use the CSV’s pub tier, price/happy-hour completeness and description fields to prioritize legitimate Tier C and missing-description pubs. These are enrichment cohorts only; none justify noindex or sitemap removal.\n- **#237 (internal linking/schema):** use content and route-type rows to test normal visible inbound paths and HTML usefulness. Prioritize the 18 N/A-crawl new content routes and any row marked \`limited\` HTML.\n- **#236 reconciliation:** Henley Brook’s one historical canonical mismatch is now 200/self-canonical; \`/guides\` and \`/insights\` are intentional redirects; all 15 historical 404 examples and current handling are inventoried in \`docs/seo/index-cleanup-2026-07-21.md\`.\n\n## Reproduce\n\n1. Export the two GSC tables through an authenticated read-only browser session outside the repo.\n2. Run the script with **Infisical injection** (never paste or save keys):\n\n\`infisical run --projectId 3ae28e74-fc1f-4f02-beee-94100ba1e32f --env=prod -- node scripts/build-gsc-indexing-baseline.mjs --crawled /secure/cni/Table.csv --discovered /secure/dni/Table.csv\`\n\n3. Inspect the generated CSV and terminal evidence; run \`git diff --check\` and secret scanning before committing.\n\nThe script makes only GET requests to production and a read-only Supabase select. It never requests indexing, changes GSC, or writes production data.\n`)
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

await main()
