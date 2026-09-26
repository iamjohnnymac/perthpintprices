import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

// price_reports holds reporter names, IP hashes and free-text notes. The public
// anon key may insert reports but never read them back; server code reads
// through the service role. These checks keep an anon read from creeping back.

const SRC = join(process.cwd(), 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : []
  })
}

describe('price_reports read access', () => {
  it('never reads price_reports through an anon client', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const source = readFileSync(file, 'utf8')
      const anonVars = [...source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*anonClient\(\)/g)].map(match => match[1])
      for (const name of anonVars) {
        const read = new RegExp(`\\b${name}\\s*\\.from\\(\\s*['"]price_reports['"]\\s*\\)\\s*\\.select\\(`)
        if (read.test(source)) offenders.push(`${file.replace(`${process.cwd()}/`, '')} (${name})`)
      }
    }
    assert.deepEqual(offenders, [])
  })

  it('keeps the public report endpoint write-only', () => {
    const route = readFileSync(join(SRC, 'app/api/price-report/route.ts'), 'utf8')
    assert.doesNotMatch(route, /export\s+async\s+function\s+GET\b/)
  })

  it('drops the public read policy in a migration', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20260926000000_restrict_price_reports_reads.sql'), 'utf8')
    assert.match(migration, /drop policy if exists "Anyone can read price reports" on public\.price_reports;/i)
  })
})
