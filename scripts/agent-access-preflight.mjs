import { ACCESS_BUNDLES, inspectAccessBundle, validateOnlineAccess } from './lib/agent-access.mjs'

const bundleName = process.argv[2]
if (!bundleName) {
  console.error(`Usage: npm run access:preflight -- <bundle>\nBundles: ${Object.keys(ACCESS_BUNDLES).join(', ')}`)
  process.exit(1)
}

let checks
try {
  checks = inspectAccessBundle(bundleName)
} catch (error) {
  console.error(`[access-preflight] FAIL: ${error.message}`)
  process.exit(1)
}

for (const check of checks) {
  console.log(`[access-preflight] ${check.name}: ${check.present ? 'present' : 'missing'}`)
}
if (checks.some(check => !check.present)) process.exit(1)
if (process.argv.includes('--online')) {
  try {
    const online = await validateOnlineAccess(bundleName)
    console.log(`[access-preflight] online identity: verified (HTTP ${online.status})`)
  } catch (error) {
    console.error(`[access-preflight] online identity: failed (${error.message})`)
    process.exit(1)
  }
}
console.log(`[access-preflight] PASS: ${bundleName}`)
