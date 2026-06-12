import type { Metadata } from 'next'
import { readdir } from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Dev-only index of AI article drafts. 404 in production; noindex.

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return { title: 'Article drafts', robots: { index: false, follow: false } }
}

async function listDraftSlugs(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), 'drafts'))
    return files.filter(f => f.endsWith('.draft.json')).map(f => f.replace(/\.draft\.json$/, '')).sort()
  } catch {
    return []
  }
}

export default async function DraftIndexPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const slugs = await listDraftSlugs()

  return (
    <main className="mx-auto min-h-screen max-w-container bg-[#FDF8F0] px-6 py-12">
      <p className="type-eyebrow text-amber">Dev only</p>
      <h1 className="type-hero-editorial mt-1">Article drafts</h1>
      <p className="mt-4 max-w-[640px] font-body text-[0.92rem] leading-relaxed text-gray-mid">
        Previews of AI-drafted articles, rendered in the real styling but never published.
        Generate one with <code className="font-mono text-[0.85em]">node scripts/draft-article.mjs --topic &quot;...&quot;</code>.
      </p>

      {slugs.length === 0 ? (
        <p className="mt-8 rounded-card border-3 border-ink bg-white p-5 font-body text-[0.9rem] text-gray-mid shadow-hard-sm">
          No drafts yet. Run the draft script, then refresh.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-gray-light rounded-card border-3 border-ink bg-white shadow-hard-sm">
          {slugs.map(slug => (
            <li key={slug}>
              <Link href={`/draft/${slug}`} className="flex items-center justify-between gap-4 px-5 py-4 no-underline hover:bg-off-white">
                <span className="font-mono text-[0.86rem] font-bold text-ink">{slug}</span>
                <span className="font-mono text-[0.7rem] font-bold uppercase text-amber">Preview →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
