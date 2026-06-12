import type { Metadata } from 'next'
import { readFile } from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/ArticleView'
import { getPubs } from '@/lib/supabase'
import type { Article } from '@/lib/articles'

// Dev-only preview of an AI draft (scripts/draft-article.mjs writes the JSON).
// Renders in the real article styling so you can review a draft as it'll look
// published — without publishing it. Returns 404 in production and is noindex;
// the drafts/ directory is gitignored, so this never ships any content anyway.

export const dynamic = 'force-dynamic'

interface DraftPreviewProps {
  params: { slug: string }
}

const isProduction = process.env.NODE_ENV === 'production'
const isSafeSlug = (slug: string) => /^[a-z0-9-]+$/.test(slug)

async function loadDraft(slug: string): Promise<Article | null> {
  if (!isSafeSlug(slug)) return null
  try {
    const raw = await readFile(path.join(process.cwd(), 'drafts', `${slug}.draft.json`), 'utf8')
    const data = JSON.parse(raw)
    // Light shape guard so a hand-broken draft 404s instead of throwing in ArticleView.
    if (!data || typeof data.title !== 'string' || !Array.isArray(data.sections) || !Array.isArray(data.supportingImages)) return null
    return data as Article
  } catch {
    return null
  }
}

export function generateMetadata(): Metadata {
  return { title: 'Draft preview', robots: { index: false, follow: false } }
}

export default async function DraftPreviewPage({ params }: DraftPreviewProps) {
  if (isProduction) notFound()

  const article = await loadDraft(params.slug)
  if (!article) notFound()

  const pubs = await getPubs()

  return (
    <>
      <div className="sticky top-0 z-50 border-b-3 border-ink bg-amber px-6 py-2 text-center font-mono text-[0.7rem] font-bold uppercase tracking-wide text-ink">
        Draft preview · not published · /draft/{params.slug}
      </div>
      <ArticleView article={article} pubs={pubs} />
    </>
  )
}
