interface ArticleJsonLdInput {
  url: string
  headline: string
  description: string
  dateModified: string
  lastReviewed: string
}

export function buildArticleJsonLd({
  url,
  headline,
  description,
  dateModified,
  lastReviewed,
}: ArticleJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline,
    description,
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
      name: 'Perth Pint Prices',
      url: 'https://perthpintprices.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://perthpintprices.com/og-image.png',
      },
    },
    dateModified,
  }
}
