import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import { ArticleView } from '@/components/ArticleView'
import { buildArticleJsonLd } from '@/lib/articleJsonLd'
import { absoluteArticleUrl, articles, getArticle } from '@/lib/articles'
import { getCachedPubs } from '@/lib/cachedPubs'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return articles.map(article => ({ slug: article.slug }))
}

export async function generateMetadata(props: ArticlePageProps): Promise<Metadata> {
  const params = await props.params
  const article = getArticle(params.slug)
  if (!article) return {}
  const canonical = absoluteArticleUrl(article.slug)

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical },
    openGraph: {
      title: `${article.title} | Perth Pint Prices`,
      description: article.description,
      url: canonical,
      siteName: 'Perth Pint Prices',
      locale: 'en_AU',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      images: [{ url: `https://perthpintprices.com${article.image}`, width: 1200, height: 630, alt: article.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
    },
  }
}

export default async function ArticlePage(props: ArticlePageProps) {
  const params = await props.params
  const article = getArticle(params.slug)
  if (!article) notFound()

  const pubs = await getCachedPubs()
  const canonical = absoluteArticleUrl(article.slug)
  const articleJsonLd = buildArticleJsonLd({
    url: canonical,
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    lastReviewed: article.updatedAt,
    imageUrl: `https://perthpintprices.com${article.image}`,
    type: 'BlogPosting',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://perthpintprices.com' },
        { name: 'Articles', url: 'https://perthpintprices.com/articles' },
        { name: article.title, url: canonical },
      ]} />
      <ArticleView article={article} pubs={pubs} />
    </>
  )
}
