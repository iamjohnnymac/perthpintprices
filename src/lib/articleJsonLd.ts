interface ArticleJsonLdInput {
  url: string
  headline: string
  description: string
  dateModified: string
  lastReviewed: string
  datePublished?: string
  imageUrl?: string
  type?: 'Article' | 'BlogPosting'
}

export function buildArticleJsonLd({
  url,
  headline,
  description,
  dateModified,
  lastReviewed,
  datePublished,
  imageUrl,
  type = 'Article',
}: ArticleJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#article`,
    headline,
    description,
    ...(datePublished ? { datePublished } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
      lastReviewed,
    },
    author: {
      '@type': 'Organization',
      name: 'Perth Pint Prices',
      url: 'https://perthpintprices.com',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://perthpintprices.com/#organization',
      name: 'Perth Pint Prices',
      url: 'https://perthpintprices.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://perthpintprices.com/logo.png',
        width: 1024,
        height: 1024,
      },
    },
    image: imageUrl || 'https://perthpintprices.com/og-image.png',
    dateModified,
  }
}
