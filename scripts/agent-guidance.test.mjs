import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const [agents, claude] = await Promise.all([
  readFile(new URL('../AGENTS.md', import.meta.url), 'utf8'),
  readFile(new URL('../CLAUDE.md', import.meta.url), 'utf8'),
])

test('AGENTS.md is the canonical project-specific guide', async () => {
  assert.match(agents, /canonical repository guide/i)

  const pointers = [
    '.claude/commands/pm-loop.md',
    'docs/brand-voice-brief.md',
    'docs/superpowers/specs/2026-06-01-price-intake-plumbing-design.md',
    'docs/ops/secret-inventory.md',
    'docs/seo/suburb-indexability-policy-2026-07-21.md',
    'tailwind.config.ts',
    '.github/workflows/ci.yml',
    'tests/e2e/README.md',
  ]

  for (const pointer of pointers) {
    assert.ok(agents.includes(pointer), `AGENTS.md must route ${pointer}`)
    await access(new URL(`../${pointer}`, import.meta.url))
  }
})

test('CLAUDE.md imports the canonical guide instead of duplicating it', () => {
  assert.equal(claude, '# CLAUDE.md\n\n@AGENTS.md\n')
})
