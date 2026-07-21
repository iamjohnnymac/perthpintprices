export interface SitemapIndexEntry {
  url: string
  lastModified?: string
}

export interface SitemapUrlEntry {
  url: string
  lastModified: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export function buildSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const sitemaps = entries.map(entry => [
    '  <sitemap>',
    `    <loc>${escapeXml(entry.url)}</loc>`,
    entry.lastModified ? `    <lastmod>${escapeXml(entry.lastModified)}</lastmod>` : null,
    '  </sitemap>',
  ].filter(Boolean).join('\n')).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`
}

export function buildUrlSetXml(entries: SitemapUrlEntry[]): string {
  const urls = entries.map(entry => [
    '  <url>',
    `    <loc>${escapeXml(entry.url)}</loc>`,
    `    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`,
    `    <changefreq>${entry.changeFrequency}</changefreq>`,
    `    <priority>${entry.priority.toFixed(1)}</priority>`,
    '  </url>',
  ].join('\n')).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function sitemapIndexResponse(entries: SitemapIndexEntry[]): Response {
  return xmlResponse(buildSitemapIndexXml(entries))
}

export function urlSetResponse(entries: SitemapUrlEntry[]): Response {
  return xmlResponse(buildUrlSetXml(entries))
}
