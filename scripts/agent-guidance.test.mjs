import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [agents, claude] = await Promise.all([
  readFile(new URL('../AGENTS.md', import.meta.url), 'utf8'),
  readFile(new URL('../CLAUDE.md', import.meta.url), 'utf8'),
])

test('AGENTS.md is the canonical project-specific guide', () => {
  assert.match(agents, /canonical repository guide/i)

  for (const pointer of [
    '.claude/commands/pm-loop.md',
    'docs/brand-voice-brief.md',
    'docs/price-verification-kit.md',
    'docs/ops/secret-inventory.md',
    'docs/SEO-MASTER.md',
    'tailwind.config.ts',
    '.github/workflows/ci.yml',
    'tests/e2e/README.md',
  ]) {
    assert.ok(agents.includes(pointer), `AGENTS.md must route ${pointer}`)
  }
})

test('CLAUDE.md imports the canonical guide instead of duplicating it', () => {
  assert.equal(claude, '# CLAUDE.md\n\n@AGENTS.md\n')
})

test('the always-loaded guide avoids point-in-time inventory snapshots', () => {
  for (const fragilePattern of [
    /Next\.js\s+\d+/i,
    /currently\s+\d+\s+pubs/i,
    /routes?\s*\(\d+/i,
    /components?\s*\(\d+/i,
    /lib files?\s*\(\d+/i,
  ]) {
    assert.doesNotMatch(agents, fragilePattern)
  }
})
