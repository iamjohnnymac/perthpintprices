import assert from 'node:assert/strict'
import nextConfig from '../next.config.js'

assert.equal(nextConfig.poweredByHeader, false)

const rules = await nextConfig.headers()
const globalRule = rules.find(rule => rule.source === '/(.*)')
const headers = Object.fromEntries((globalRule?.headers ?? []).map(({ key, value }) => [key, value]))

assert.equal(headers['X-Content-Type-Options'], 'nosniff')
assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
assert.equal(headers['X-Frame-Options'], 'DENY')
assert.equal(headers['Permissions-Policy'], 'camera=(), microphone=(), geolocation=(self)')
assert.match(headers['Content-Security-Policy-Report-Only'], /default-src 'self'/)
assert.match(headers['Content-Security-Policy-Report-Only'], /object-src 'none'/)
assert.match(headers['Content-Security-Policy-Report-Only'], /report-uri \/api\/csp-report/)
