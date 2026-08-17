import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')

// Steps sit six spaces deep under `steps:`; splitting on the name key gives one block each.
const steps = workflow
  .split(/^ {6}- name: /m)
  .slice(1)
  .map(block => {
    const [heading, ...rest] = block.split('\n')
    return { name: heading.trim(), body: rest.join('\n') }
  })

function step(name) {
  const found = steps.find(candidate => candidate.name === name)
  assert.ok(found, `CI workflow is missing the "${name}" step`)
  return found
}

const GATE = "steps.supabase.outputs.available == 'true'"

// The guard decides whether the Supabase-backed steps can run at all.
const guard = step('Resolve Supabase build credentials')
assert.match(guard.body, /id: supabase/)
assert.match(guard.body, /available=true/)
assert.match(guard.body, /available=false/)
assert.match(guard.body, /dependabot\[bot\]/)
// Fails closed: absent secrets on a non-Dependabot run is a misconfiguration, not a skip.
assert.match(guard.body, /exit 1/)

// Steps that need a live Supabase only run when the credentials resolved.
for (const name of ['Build', 'Playwright PR proof', 'Upload Playwright proof']) {
  assert.ok(step(name).body.includes(GATE), `"${name}" must be gated on the Supabase credential guard`)
}

// The credential-free gates stay unconditional — they are the whole signal on a Dependabot PR.
for (const name of [
  'TypeScript check',
  'Lint',
  'Test',
  'GSC baseline refresh contract test',
  'Redirect + SEO config test',
  'Security header config test',
  'Agent access contract test',
  'CI workflow contract test',
]) {
  assert.ok(
    !/^\s+if:/m.test(step(name).body),
    `"${name}" must not be conditional — Dependabot PRs are gated on it`,
  )
}

console.log(`[ci-workflow] PASS: ${steps.length} steps checked`)
