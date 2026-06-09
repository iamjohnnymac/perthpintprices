#!/usr/bin/env node
/**
 * draft-article.mjs — v1 in-repo content drafting pipeline for Perth Pint Prices.
 *
 * Pulls real pub data from Supabase, builds a data-grounded brief, drafts an
 * article with Claude in the house voice, runs a humanizer pass to strip AI
 * tells, and writes a publish-ready draft (a TS `Article` object + a readable
 * .md) into drafts/ for you to review, fact-check, add images, and paste into
 * src/lib/articles.ts.
 *
 * This is the "build it in-repo" alternative to a paid tool (Cuppa/Koala/Byword):
 * BYOK (your own Anthropic key — you pay Anthropic directly), grounded in your
 * proprietary Supabase price data, ending in the human-edit step you already run.
 *
 * Setup (.env.local in the repo root):
 *   ANTHROPIC_API_KEY=sk-ant-...      required — your own key (BYOK)
 *   SUPABASE_SERVICE_ROLE_KEY=...     required — same key the other scripts use
 *   NEXT_PUBLIC_SUPABASE_URL=...      optional — defaults to prod
 *   CLAUDE_MODEL=claude-opus-4-8      optional — default; set claude-sonnet-4-6 to cut cost
 *   DOTENV_PATH=...                   optional — point dotenv at a different .env file
 *
 * Usage:
 *   node scripts/draft-article.mjs --topic "Best beer gardens in Perth"
 *   node scripts/draft-article.mjs --topic "Cheapest pints in Fremantle" --suburb "Fremantle" --liveModule under10
 *   node scripts/draft-article.mjs --topic "..." --keywords "cheap pints perth,perth happy hour"
 *   node scripts/draft-article.mjs --topic "..." --suburb "Fremantle" --dry-run   # data + brief only, no LLM calls
 *
 * --keywords is the optional "Ahrefs-assisted" input: Claude Code can populate it
 * from the Ahrefs MCP before running (the script itself can't call MCP).
 *
 * Output (drafts/ — gitignored, excluded from tsc):
 *   drafts/<slug>.draft.ts   the Article object to review, edit, and paste into src/lib/articles.ts
 *   drafts/<slug>.draft.md   readable rendering for review / tool bake-off comparison
 *
 * Sources: Anthropic call grounded in the claude-api skill reference; Supabase
 * access mirrors scripts/backfill-place-attributes.mjs.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFile, writeFile, mkdir } from 'fs/promises'

config({ path: process.env.DOTENV_PATH || '.env.local' })

// ── CLI args ────────────────────────────────────────────────────────────────
const argVal = (name, def = null) => {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def
}
const hasFlag = (name) => process.argv.includes(`--${name}`)

const topic = argVal('topic')
const suburb = argVal('suburb')
const keywords = (argVal('keywords') || '').split(',').map((s) => s.trim()).filter(Boolean)
const limit = Number(argVal('limit')) || 30
const DRY_RUN = hasFlag('dry-run')
const LIVE_MODULES = ['under10', 'happyHoursByDay', 'glassSizes']
const liveModule = argVal('liveModule') || liveModuleHeuristic(topic || '')

if (!topic) {
  console.error('Required: --topic "<article angle>"\n' +
    'e.g. node scripts/draft-article.mjs --topic "Cheapest pints in Fremantle" --suburb "Fremantle"')
  process.exit(1)
}
if (liveModule && !LIVE_MODULES.includes(liveModule)) {
  console.error(`--liveModule must be one of: ${LIVE_MODULES.join(', ')} (the existing interactive modules). Got "${liveModule}".`)
  process.exit(1)
}

// ── Env ───────────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MODEL = argVal('model') || process.env.CLAUDE_MODEL || 'claude-opus-4-8'

if (!SUPA_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (add it to .env.local, or set DOTENV_PATH).')
  process.exit(1)
}
if (!DRY_RUN && !ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Add your own Anthropic key (BYOK) to .env.local, or use --dry-run to test the data/brief half without the LLM.')
  process.exit(1)
}

const supabase = createClient(SUPA_URL, SUPA_KEY)
const slugify = (s) => s.toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const round2 = (n) => Math.round(n * 100) / 100

function liveModuleHeuristic(t) {
  const s = t.toLowerCase()
  if (/(happy\s*hour|deal|arvo)/.test(s)) return 'happyHoursByDay'
  if (/(schooner|middy|\bglass|570\s?ml|425\s?ml|285\s?ml)/.test(s)) return 'glassSizes'
  return 'under10' // cheap-pints module is the safest default for price-led pieces ('pint' alone must NOT trigger glassSizes)
}

// ── Pexels stock photos (draft-only placeholders — swap for real venue shots before publishing) ──
const PEXELS_QUERIES = ['beer pint pub', 'craft beer bar', 'beer garden outdoor', 'beer tap pour', 'pub bar interior', 'friends drinking beer', 'bartender pouring beer', 'cold beer glass']

function pexelsQueryForTopic(t) {
  const s = t.toLowerCase()
  if (/happy\s*hour/.test(s)) return 'bar evening drinks'
  if (/(schooner|middy|glass|size|pour|ml)/.test(s)) return 'beer glasses pint'
  if (/garden/.test(s)) return 'beer garden outdoor'
  return 'beer pint pub bar'
}

async function pexelsSearch(query, key, used) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: key } })
  if (!res.ok) throw new Error(`Pexels API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const photos = (await res.json()).photos || []
  return photos.find((p) => !used.has(p.id)) || photos[0] || null
}

async function downloadTo(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`image download ${res.status}`)
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

// ── 1. Pull real data from Supabase (the E-E-A-T moat: proprietary, dated prices) ──
console.log(`Pulling pub data from Supabase${suburb ? ` for ${suburb}` : ' (site-wide)'}...`)
const { data: rows, error } = await supabase
  .from('pubs')
  .select('name, slug, suburb, price, price_verified, happy_hour, happy_hour_price, beer_type, last_verified')
  .not('price', 'is', null)
  .or('price_verified.is.null,price_verified.eq.true')
  .order('price', { ascending: true, nullsFirst: false })

if (error) {
  console.error('Supabase error:', error.message)
  process.exit(1)
}

const verified = (rows || []).filter((p) => p.price != null)
if (verified.length === 0) {
  console.error('No verified-priced pubs returned — check Supabase access.')
  process.exit(1)
}
const siteAvg = round2(verified.reduce((s, p) => s + Number(p.price), 0) / verified.length)
const siteCheapest = verified[0]

const scope = suburb ? verified.filter((p) => (p.suburb || '').toLowerCase() === suburb.toLowerCase()) : verified
if (suburb && scope.length === 0) {
  console.error(`No verified-priced pubs found for suburb "${suburb}". Use the suburb's display name, e.g. --suburb "Fremantle".`)
  process.exit(1)
}
const scopeAvg = round2(scope.reduce((s, p) => s + Number(p.price), 0) / scope.length)
const pubsForBrief = scope.slice(0, limit)

// Internal links the writer is allowed to use (kept to real, resolvable paths).
const suburbSlug = suburb ? slugify(suburb) : null
const availableLinks = [
  { href: '/discover', label: 'All Perth pint prices' },
  { href: '/happy-hour', label: 'Happy hours running now' },
  { href: '/suburbs', label: 'Browse pubs by suburb' },
  { href: '/insights/pint-index', label: 'How the Pint Index works' },
  ...(suburbSlug ? [{ href: `/${suburbSlug}`, label: `All ${suburb} pint prices` }] : []),
  ...pubsForBrief.slice(0, 8).map((p) => ({ href: `/${slugify(p.suburb)}/${p.slug}`, label: `${p.name}, ${p.suburb}` })),
]

const now = new Date()
const perthDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Perth', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
const publishedAt = `${perthDate}T00:00:00.000+08:00`

const dataPack = {
  topic,
  suburb: suburb || null,
  targetKeywords: keywords,
  generatedOn: perthDate,
  stats: {
    scope: suburb || 'all Perth',
    scopePubCount: scope.length,
    scopeAveragePrice: scopeAvg,
    siteAveragePrice: siteAvg,
    siteVerifiedCount: verified.length,
    cheapestInPerth: siteCheapest ? { name: siteCheapest.name, suburb: siteCheapest.suburb, price: Number(siteCheapest.price) } : null,
  },
  pubs: pubsForBrief.map((p) => ({
    name: p.name,
    suburb: p.suburb,
    price: Number(p.price),
    happyHour: p.happy_hour || null,
    happyHourPrice: p.happy_hour_price != null ? Number(p.happy_hour_price) : null,
    beerType: p.beer_type || null,
    lastChecked: p.last_verified || null,
  })),
  availableLinks,
}

console.log(`  ${scope.length} verified-priced pubs in scope (avg $${scopeAvg}); site avg $${siteAvg} across ${verified.length}.`)

if (DRY_RUN) {
  console.log('\n--- DRY RUN: data pack (no LLM calls) ---')
  console.log(JSON.stringify(dataPack, null, 2))
  console.log(`\nliveModule (heuristic/arg): ${liveModule}`)
  console.log('Re-run without --dry-run (and with ANTHROPIC_API_KEY set) to draft the article.')
  process.exit(0)
}

// ── Claude (raw Messages API via fetch — no SDK) ──────────────────────────────
const exemplarsSrc = await readFile('src/lib/articles.ts', 'utf8').catch(() => '')
// Shared, cached system block: the real articles are the voice + structure spec.
// Byte-identical across the draft and humanize calls so it shares the prompt cache.
const exemplarBlock = {
  type: 'text',
  text: 'STYLE EXEMPLARS — the existing Perth Pint Prices articles (TypeScript source). Match this voice, ' +
    'rhythm and structure exactly; this is the target, not a suggestion:\n\n' + exemplarsSrc,
  cache_control: { type: 'ephemeral' },
}

const VOICE_RULES = `PERTH PINT PRICES HOUSE VOICE — non-negotiable:
- Dry, plain, confident. Australian English. No hype, no salesmanship.
- Answer-first: open with the bottom line, not a throat-clear.
- Every price carries context — the suburb or site average, and the "last checked" date — because a price without a date is a guess.
- State honest caveats plainly (data freshness, coverage gaps, happy-hour windows hiding behind an "all-day" number). Trust is the product.
- Weave in real structural/historical context where it explains a price (excise, licensing, club vs hotel economics) — only if true and relevant.
- Short, punchy section closers. Vary sentence length. Specific over generic.

HARD RULES:
- Ground EVERY number, price, pub name, suburb and date ONLY in the DATA PACK provided in the user message. NEVER invent or estimate a price, date, or venue. If you don't have a figure, say so or leave it out.
- Do not claim a pub has a happy-hour discount unless the data pack shows a happyHourPrice for it.
- relatedLinks MUST be chosen only from the availableLinks list in the data pack (copy href + label verbatim). Pick 3-4.
- Australian spelling (e.g. "cosy", "neighbourhood"). No emojis.
- BANNED words/phrases: "delve", "in today's", "fast-paced", "nestled", "boasts", "vibrant", "bustling", "hidden gem", "whether you're", "look no further", "in conclusion", "moreover", "furthermore", "elevate", "unlock", "game-changer", "when it comes to", "that being said".`

// ── 2 + 3. Build brief + draft with Claude ────────────────────────────────────
const SECTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    heading: { type: 'string' },
    body: { type: 'array', items: { type: 'string' } },
  },
  required: ['heading', 'body'],
}
const DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    deck: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string', enum: ['Cheap pints', 'Happy hour', 'Pub data', 'Perth drinking basics'] },
    heroLabel: { type: 'string' },
    heroStat: { type: 'string' },
    heroSubstat: { type: 'string' },
    imageAlt: { type: 'string' },
    sections: { type: 'array', items: SECTION_SCHEMA },
    supportingImages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { alt: { type: 'string' }, caption: { type: 'string' }, sectionHeading: { type: 'string' } },
        required: ['alt', 'caption', 'sectionHeading'],
      },
    },
    relatedLinks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { href: { type: 'string' }, label: { type: 'string' } },
        required: ['href', 'label'],
      },
    },
  },
  required: ['title', 'deck', 'description', 'category', 'heroLabel', 'heroStat', 'heroSubstat', 'imageAlt', 'sections', 'supportingImages', 'relatedLinks'],
}

const draftTask = `${VOICE_RULES}

TASK: Write a Perth Pint Prices article for this brief, returning the structured fields.
- title: <60 characters, specific, no clickbait.
- description: <160 characters, for the meta description.
- category: pick the best-fitting of the four.
- 5 to 7 sections. The FIRST section must be "The short version" — an answer-first summary grounded in the data pack stats.
- Each section: a short heading + 1 to 3 paragraphs in body[].
- supportingImages: 3 to 4 entries; each sectionHeading MUST match one of your section headings exactly. alt = plain description; caption = a real, useful sentence tied to that section.
- heroStat/heroSubstat: a single headline figure from the data (e.g. the cheapest price or the count) + a one-line qualifier.
- ${keywords.length ? `Work these target keywords in naturally where they fit (do not stuff): ${keywords.join(', ')}.` : 'No target keywords supplied — write for the topic.'}

DATA PACK (your only source of facts):
${JSON.stringify(dataPack, null, 2)}`

console.log(`Drafting with ${MODEL}...`)
const draft = await callClaude({ system: [exemplarBlock, { type: 'text', text: draftTask }], userText: 'Write the article now, returning only the structured object.', schema: DRAFT_SCHEMA, label: 'draft' })

// ── 4. Humanize pass — strip AI tells, tighten, keep every fact identical ──────
const HUMANIZE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    deck: { type: 'string' },
    description: { type: 'string' },
    sections: { type: 'array', items: SECTION_SCHEMA },
  },
  required: ['deck', 'description', 'sections'],
}
const humanizeTask = `${VOICE_RULES}

TASK: You are a ruthless line editor. Rewrite the deck, description and sections below to read like a sharp human wrote them in the house voice — NOT like AI.
- PRESERVE every fact, number, price, pub name, suburb and date EXACTLY. Do not add, drop, or alter a single figure or claim. You are changing wording only.
- Keep the same section headings and the same number of sections; you may merge paragraphs but keep the structure.
- Cut filler, hedging and any of the banned phrases. Break up uniform sentence rhythm. Make the openings answer-first and the closers land.
- Keep description under 160 characters and the answer-first "short version" intact.

DRAFT TO EDIT:
${JSON.stringify({ deck: draft.deck, description: draft.description, sections: draft.sections }, null, 2)}`

console.log('Humanizing...')
const humanized = await callClaude({ system: [exemplarBlock, { type: 'text', text: humanizeTask }], userText: 'Return only the rewritten structured object.', schema: HUMANIZE_SCHEMA, label: 'humanize' })

// ── 5. Assemble the final Article object ──────────────────────────────────────
const title = draft.title.trim()
const slug = slugify(title).slice(0, 60)
const sections = humanized.sections
const wordCount = [humanized.deck, ...sections.flatMap((s) => s.body)].join(' ').split(/\s+/).filter(Boolean).length
const readingMinutes = Math.max(3, Math.round(wordCount / 200))

const supportingImages = (draft.supportingImages || []).map((si, i) => ({
  src: `/articles/${slug}-0${i + 2}-${slugify(si.sectionHeading).slice(0, 40) || 'image'}.png`,
  alt: si.alt,
  caption: si.caption,
  sectionHeading: si.sectionHeading,
}))

const article = {
  slug,
  title,
  deck: humanized.deck,
  description: humanized.description,
  category: draft.category,
  author: 'Perth Pint Prices',
  publishedAt,
  updatedAt: publishedAt,
  readingMinutes,
  heroLabel: draft.heroLabel,
  heroStat: draft.heroStat,
  heroSubstat: draft.heroSubstat,
  image: `/articles/${slug}-01-hero.png`,
  imageAlt: draft.imageAlt,
  supportingImages,
  liveModule,
  sections,
  relatedLinks: draft.relatedLinks,
}

// ── 5b. Pexels photos (draft-only) — pull real images so the preview looks complete ──
const wantPhotos = !hasFlag('no-photos')
const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const pexelsCredits = []
if (wantPhotos && PEXELS_API_KEY) {
  console.log('Fetching Pexels photos...')
  const used = new Set()
  const assetDir = `public/_drafts/${slug}`
  await mkdir(assetDir, { recursive: true })
  const slots = [
    { name: 'hero', query: pexelsQueryForTopic(topic), apply: (src) => { article.image = src } },
    ...article.supportingImages.map((si, i) => ({ name: `support-${i + 1}`, query: PEXELS_QUERIES[i % PEXELS_QUERIES.length], apply: (src) => { si.src = src } })),
  ]
  let saved = 0
  for (const slot of slots) {
    try {
      const photo = await pexelsSearch(slot.query, PEXELS_API_KEY, used)
      if (!photo) { console.log(`  no Pexels result for "${slot.query}"`); continue }
      used.add(photo.id)
      saved += 1
      const file = `${String(saved).padStart(2, '0')}-${slugify(slot.query).slice(0, 24)}.jpg`
      await downloadTo(photo.src.large, `${assetDir}/${file}`)
      slot.apply(`/_drafts/${slug}/${file}`)
      pexelsCredits.push({ slot: slot.name, photographer: photo.photographer, photographerUrl: photo.photographer_url, pexelsUrl: photo.url, query: slot.query })
    } catch (e) {
      console.log(`  Pexels ${slot.name} failed: ${e.message}`)
    }
  }
  console.log(`  ${saved} photos saved to ${assetDir}/ (Pexels — draft placeholders)`)
} else if (wantPhotos) {
  console.log('  No PEXELS_API_KEY set — keeping placeholder image paths. Add a free key (pexels.com/api) to populate photos.')
}

// ── 6. Write reviewable drafts ────────────────────────────────────────────────
await mkdir('drafts', { recursive: true })

const imageTodo = pexelsCredits.length
  ? `//   [ ] Images are Pexels DRAFT placeholders (/_drafts/${slug}/...) — replace with real venue photos in /articles/ before publishing.`
  : '//   [ ] Create the hero + supporting images (paths are placeholders) or trim supportingImages.'
const pexelsNote = pexelsCredits.length
  ? '\n// Pexels draft-image credits (Pexels License — free; attribution appreciated):\n' +
    pexelsCredits.map((c) => `//   ${c.slot}: photo by ${c.photographer} — ${c.pexelsUrl}`).join('\n') + '\n'
  : ''
const tsOut = `// DRAFT — generated by scripts/draft-article.mjs on ${perthDate}. NOT published.
// Before publishing, REVIEW + EDIT this object, then paste it into the \`articles\` array in src/lib/articles.ts.
// TODO checklist:
//   [ ] Fact-check every price/date/name against the live pub pages (the draft is only as fresh as the DB).
//   [ ] Run the humanizer skill over the prose as a final pass.
${imageTodo}
//   [ ] Confirm liveModule "${liveModule}" suits this topic, or build/choose the right interactive module.
//   [ ] Verify every relatedLinks href resolves (slugs are derived, not validated).
//   [ ] Trim the title to <60 chars and description to <160 if needed (title is ${title.length}, description ${article.description.length}).
${pexelsNote}import type { Article } from '@/lib/articles'

export const draft: Article = ${JSON.stringify(article, null, 2)}
`
const tsPath = `drafts/${slug}.draft.ts`
await writeFile(tsPath, tsOut, 'utf8')

const mdOut = `# ${title}

> ${article.deck}

**Meta description:** ${article.description}
**Category:** ${article.category} · **Reading time:** ${readingMinutes} min · **liveModule:** ${liveModule}
**Hero:** ${article.heroStat} — ${article.heroSubstat}

---

${sections.map((s) => `## ${s.heading}\n\n${s.body.join('\n\n')}`).join('\n\n')}

---

**Related links:** ${article.relatedLinks.map((l) => `[${l.label}](${l.href})`).join(' · ')}

*Draft generated ${perthDate} from ${scope.length} ${suburb || 'Perth'} pubs. Review + humanize before publishing.*
`
const mdPath = `drafts/${slug}.draft.md`
await writeFile(mdPath, mdOut, 'utf8')

// JSON consumed by the dev-only /draft/[slug] preview route (renders in the real styling).
const jsonPath = `drafts/${slug}.draft.json`
await writeFile(jsonPath, JSON.stringify({ ...article, _meta: { topic, generatedOn: perthDate, model: MODEL, pexels: pexelsCredits } }, null, 2), 'utf8')

console.log(`\nDone. ${wordCount} words, ${sections.length} sections.`)
console.log(`  Preview:  http://localhost:3001/draft/${slug}   ← \`npm run dev\`, then open (real styling, never published)`)
console.log(`  ${tsPath}   ← review + edit, then paste into src/lib/articles.ts`)
console.log(`  ${mdPath}   ← readable version (for the tool bake-off)`)
console.log(`  ${jsonPath} ← feeds the /draft preview route`)
if (title.length > 60) console.log(`  ⚠ title is ${title.length} chars (>60) — tighten it.`)
if (article.description.length > 160) console.log(`  ⚠ description is ${article.description.length} chars (>160) — tighten it.`)

// ── Claude call helper ────────────────────────────────────────────────────────
async function callClaude({ system, userText, schema, maxTokens = 16000, label }) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userText }],
    thinking: { type: 'adaptive' }, // Opus 4.8 / Sonnet 4.6: adaptive only (no budget_tokens / temperature)
  }
  if (schema) body.output_config = { format: { type: 'json_schema', schema } }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status} on "${label}": ${(await res.text()).slice(0, 600)}`)
  }
  const data = await res.json()
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  const u = data.usage || {}
  console.log(`  ${label}: ${u.output_tokens ?? '?'} output tokens${u.cache_read_input_tokens ? `, ${u.cache_read_input_tokens} cached` : ''}`)
  if (!schema) return text
  try {
    return JSON.parse(text)
  } catch (e) {
    const hint = data.stop_reason === 'max_tokens' ? ' (hit max_tokens — output truncated; raise maxTokens)' : ''
    throw new Error(`${label}: response was not valid JSON (stop_reason=${data.stop_reason}${hint}; ${e.message}). First 800 chars:\n${text.slice(0, 800)}`)
  }
}
