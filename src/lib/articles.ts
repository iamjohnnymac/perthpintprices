export type ArticleCategory = 'Cheap pints' | 'Happy hour' | 'Pub data' | 'Perth drinking basics'

export type ArticleLiveModule = 'under10' | 'happyHoursByDay' | 'glassSizes'

export interface ArticleSection {
  heading: string
  body: string[]
}

export interface Article {
  slug: string
  title: string
  deck: string
  description: string
  category: ArticleCategory
  author: string
  publishedAt: string
  updatedAt: string
  readingMinutes: number
  heroLabel: string
  heroStat: string
  heroSubstat: string
  image: string
  imageAlt: string
  liveModule: ArticleLiveModule
  sections: ArticleSection[]
  relatedLinks: Array<{ href: string; label: string }>
}

export const articles: Article[] = [
  {
    slug: 'pints-under-10-perth',
    title: 'Where Perth still has pints under $10',
    deck: 'A short list for anyone who remembers when a cheap pint did not require a group chat and a spreadsheet.',
    description: 'Perth pubs with verified pints under $10, plus nearby links and freshness notes from Perth Pint Prices.',
    category: 'Cheap pints',
    author: 'Perth Pint Prices',
    publishedAt: '2026-06-03T00:00:00.000+08:00',
    updatedAt: '2026-06-03T00:00:00.000+08:00',
    readingMinutes: 4,
    heroLabel: 'Cheap pints',
    heroStat: 'Under $10',
    heroSubstat: 'Verified prices only',
    image: '/og-image.png',
    imageAlt: 'Perth Pint Prices pint-price board',
    liveModule: 'under10',
    sections: [
      {
        heading: 'The useful bit',
        body: [
          'A sub-$10 pint is still out there. It is just less likely to introduce itself politely from a blackboard out front.',
          'The list below only uses pubs with a verified regular pint price in the database. If a pub is missing, that usually means we have not checked it cleanly enough yet.',
        ],
      },
      {
        heading: 'How to use it',
        body: [
          'Start with the live rows, then click through to the pub page for the last checked date, nearby cheaper options, and any happy-hour notes we have.',
          'If the price has moved, report it. Beer inflation does not send a courtesy email.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/discover', label: 'Find tonight\'s cheapest pints' },
      { href: '/happy-hour', label: 'See happy hours on now' },
      { href: '/insights/pint-index', label: 'Check the Pint Index' },
    ],
  },
  {
    slug: 'perth-happy-hours-by-day',
    title: 'Perth happy hours by day of the week',
    deck: 'For the precise moment when someone says "one quick pint" and everyone pretends that is a plan.',
    description: 'A day-by-day Perth happy-hour guide using current happy-hour data from Perth Pint Prices.',
    category: 'Happy hour',
    author: 'Perth Pint Prices',
    publishedAt: '2026-06-03T00:00:00.000+08:00',
    updatedAt: '2026-06-03T00:00:00.000+08:00',
    readingMinutes: 5,
    heroLabel: 'Happy hour',
    heroStat: '7 days',
    heroSubstat: 'Start with what is confirmed',
    image: '/og-image.png',
    imageAlt: 'Perth Pint Prices happy-hour board',
    liveModule: 'happyHoursByDay',
    sections: [
      {
        heading: 'Happy hours move',
        body: [
          'Happy-hour boards are among Perth\'s most optimistic works of fiction. Some are current. Some were written before the last menu redesign. We only show what has made it into the database.',
          'Use this as a planning layer, then check the pub page for timing, price, and the date we last confirmed the deal.',
        ],
      },
      {
        heading: 'The rule',
        body: [
          'If a deal looks too good, it probably has a start time, a finish time, and a staff member who has had to explain both today.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/happy-hour', label: 'Happy hours running now' },
      { href: '/insights/tonights-best-bets', label: 'Tonight\'s best bets' },
      { href: '/discover', label: 'Browse all pub prices' },
    ],
  },
  {
    slug: 'proper-pint-schooner-middy-perth',
    title: 'Pint, schooner, middy: what Perth venues actually pour',
    deck: 'A pint is 570ml. A schooner is 425ml. A middy is 285ml. This should not feel like forensic accounting, but here we are.',
    description: 'A Perth guide to pint, schooner, and middy sizes, and how Perth Pint Prices treats glass sizes in pub-price data.',
    category: 'Perth drinking basics',
    author: 'Perth Pint Prices',
    publishedAt: '2026-06-03T00:00:00.000+08:00',
    updatedAt: '2026-06-03T00:00:00.000+08:00',
    readingMinutes: 3,
    heroLabel: 'Glass sizes',
    heroStat: '570ml',
    heroSubstat: 'The pint benchmark',
    image: '/og-image.png',
    imageAlt: 'Perth Pint Prices glass-size explainer',
    liveModule: 'glassSizes',
    sections: [
      {
        heading: 'Why we standardise on pints',
        body: [
          'Comparing pub prices without glass size is how a $9 schooner dresses up as a bargain. Perth Pint Prices uses a standard pint as the benchmark wherever we can confirm one.',
          'If a venue only gives us a schooner or middy price, we do not quietly pretend it is a pint. The page should say what we know, and what we do not.',
        ],
      },
      {
        heading: 'What to report',
        body: [
          'Report the glass size, beer, price, and date. A photo of the menu helps. A memory from your mate\'s birthday in 2022 does not.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/insights/pint-index', label: 'How the Pint Index works' },
      { href: '/?submit=1', label: 'Report a price' },
      { href: '/discover', label: 'See verified pint prices' },
    ],
  },
]

export function getArticle(slug: string): Article | null {
  return articles.find(article => article.slug === slug) ?? null
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return articles.filter(article => article.category === category)
}

export function articleUrl(slug: string): string {
  return `/articles/${slug}`
}

export function absoluteArticleUrl(slug: string): string {
  return `https://perthpintprices.com${articleUrl(slug)}`
}
