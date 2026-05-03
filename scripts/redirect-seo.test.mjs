import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const redirects = vercelConfig.redirects ?? []

const wwwRedirect = redirects.find(redirect =>
  redirect.has?.some(condition =>
    condition.type === 'host' && condition.value === 'www.perthpintprices.com'
  )
)

assert.equal(wwwRedirect?.destination, 'https://perthpintprices.com/:path')
assert.equal(wwwRedirect?.statusCode, 301, 'www host redirect must be an explicit 301')
assert.equal(wwwRedirect?.permanent, undefined, 'www redirect should not use permanent:true because Vercel emits 308')

const legacySuburbRedirect = redirects.find(redirect => redirect.source === '/suburb/:slug')

assert.equal(legacySuburbRedirect?.destination, '/:slug')
assert.equal(legacySuburbRedirect?.statusCode, 301, 'legacy suburb redirect must be an explicit 301')

const oldPubRoute = await readFile(new URL('../src/app/pub/[slug]/route.ts', import.meta.url), 'utf8')

assert.match(oldPubRoute, /NextResponse\.redirect\([^,]+,\s*301\)/, 'legacy pub route must redirect with status 301')
