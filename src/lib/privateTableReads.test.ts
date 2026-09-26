import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

// These tables hold reporter names, submitter emails, IP hashes and free-text
// notes. The public anon key may insert rows but never read them back; server
// code reads through the service role. These checks keep an anon read from
// creeping back.
const PRIVATE_TABLES = ['price_reports', 'pub_submissions']

const SRC = join(process.cwd(), 'src')
const MIGRATIONS = join(process.cwd(), 'supabase/migrations')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : []
  })
}

describe('private table read access', () => {
  it('never reads a private table through an anon client', () => {
    const reads = (receiver: string, table: string) =>
      new RegExp(`${receiver}\\s*\\.from\\(\\s*['"]${table}['"]\\s*\\)\\s*\\.select\\(`)
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const source = readFileSync(file, 'utf8')
      const label = file.replace(`${process.cwd()}/`, '')
      // Variables holding anonClient(), plus the anon singleton that lib/supabase.ts
      // declares and exports (imported as '@/lib/supabase' or a relative path).
      const anonVars = [
        ...[...source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*anonClient\(\)/g)].map(match => match[1]),
        ...(label === 'src/lib/supabase.ts' ? ['supabase'] : []),
        ...[...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"](?:@\/lib\/|(?:\.\.?\/)+(?:[\w-]+\/)*)supabase['"]/g)].flatMap(match =>
          match[1].split(',').map(part => part.trim()).filter(part => /^supabase\b/.test(part))
            .map(part => part.split(/\s+as\s+/).pop()!.trim())
        ),
      ]
      for (const table of PRIVATE_TABLES) {
        for (const name of anonVars) {
          if (reads(`\\b${name}`, table).test(source)) offenders.push(`${label} (${name} → ${table})`)
        }
        if (reads('anonClient\\(\\)', table).test(source)) offenders.push(`${label} (inline anonClient() → ${table})`)
      }
    }
    assert.deepEqual(offenders, [])
  })

  it('keeps the public report endpoint write-only', () => {
    const route = readFileSync(join(SRC, 'app/api/price-report/route.ts'), 'utf8')
    assert.doesNotMatch(route, /export\s+async\s+function\s+GET\b/)
  })

  it('drops the public read policies in migrations', () => {
    const migration = (name: string) => readFileSync(join(MIGRATIONS, name), 'utf8')
    assert.match(migration('20260926000000_restrict_price_reports_reads.sql'), /drop policy if exists "Anyone can read price reports" on public\.price_reports;/i)
    assert.match(migration('20260926010000_restrict_pub_submissions_reads.sql'), /drop policy if exists "Allow anonymous select" on public\.pub_submissions;/i)
  })

  it('hides crowd_reports.ip_hash but keeps the columns the live crowd function reads', () => {
    const migration = readFileSync(join(MIGRATIONS, '20260926020000_hide_crowd_report_ip_hash.sql'), 'utf8')
      .split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
    assert.match(migration, /revoke select on public\.crowd_reports from anon;/i)
    const grant = migration.match(/grant select \(([^)]*)\) on public\.crowd_reports to anon;/i)
    assert.ok(grant, 'expected a column-level SELECT grant to anon')
    const granted = grant[1].split(',').map(column => column.trim())
    assert.ok(!granted.includes('ip_hash'), 'ip_hash must not be granted to anon')

    // get_live_crowd_levels() runs with the caller's rights, so every column it
    // reads must stay granted or the public busyness badges go blank.
    const create = readFileSync(join(MIGRATIONS, '20260216061234_create_crowd_reports_table.sql'), 'utf8')
    const fn = create.slice(create.indexOf('FUNCTION get_live_crowd_levels'))
    const used = [...new Set([...fn.matchAll(/\bcr\.(\w+)/g)].map(match => match[1]))]
    assert.deepEqual(used.filter(column => !granted.includes(column)), [])
  })
})
