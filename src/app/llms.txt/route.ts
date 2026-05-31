import { BASE_URL } from '@/lib/urls'

const lines = [
  '# Perth Pint Prices',
  '',
  'Perth Pint Prices tracks community-verified pint prices, happy hours, and suburb-level beer-price trends across Perth pubs.',
  '',
  '## Canonical citation pages',
  '',
  `- [Perth Pint Index](${BASE_URL}/insights/pint-index): live Perth pint-price trend data, methodology notes, and CSV export.`,
  `- [Perth Pint Index CSV](${BASE_URL}/insights/pint-index/data.csv): public snapshot export for citation and media checks.`,
  `- [Pint of the Day](${BASE_URL}/insights/pint-of-the-day): daily venue pick from current price data.`,
  `- [Tonight's Best Bets](${BASE_URL}/insights/tonights-best-bets): live happy-hour and value picks for tonight.`,
  `- [Suburb Rankings](${BASE_URL}/insights/suburb-rankings): suburb-by-suburb pint-price comparisons.`,
  `- [Happy Hours](${BASE_URL}/happy-hour): current happy-hour finder for Perth pubs.`,
  `- [Discover](${BASE_URL}/discover): searchable pub and pint-price directory.`,
  '',
  '## High-signal suburb pages',
  '',
  `- [Fremantle](${BASE_URL}/fremantle)`,
  `- [Northbridge](${BASE_URL}/northbridge)`,
  `- [Perth](${BASE_URL}/perth)`,
  `- [Subiaco](${BASE_URL}/subiaco)`,
  `- [Leederville](${BASE_URL}/leederville)`,
  `- [Mount Lawley](${BASE_URL}/mount-lawley)`,
  `- [Victoria Park](${BASE_URL}/victoria-park)`,
  `- [Scarborough](${BASE_URL}/scarborough)`,
  '',
  '## Crawl notes',
  '',
  `- Sitemap: ${BASE_URL}/sitemap.xml`,
  '- Pub pages expose visible last-verified dates where available.',
  '- Price-less pub pages may be crawlable but intentionally noindexed until useful price or happy-hour data exists.',
]

export async function GET() {
  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
