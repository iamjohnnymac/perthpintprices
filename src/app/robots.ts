import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'Google-Extended'],
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: 'https://perthpintprices.com/sitemap.xml',
  }
}
