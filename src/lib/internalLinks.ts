import type { Pub } from '@/types/pub'
import { suburbUrl } from '@/lib/urls'

export const DISCOVER_BEST_BUYS_HREF = '/cheapest-pints'

export const DISCOVER_DATA_TOOL_LINKS = [
  {
    href: '/insights/pint-index',
    title: 'Perth Pint Index',
    description: 'The city-wide price benchmark',
    icon: 'chart',
  },
  {
    href: '/insights/pint-of-the-day',
    title: 'Pint of the Day',
    description: 'Today\'s value pick',
    icon: 'calendar',
  },
  {
    href: '/insights/tonights-best-bets',
    title: "Tonight's Best Bets",
    description: 'The strongest deals tonight',
    icon: 'moon',
  },
  {
    href: '/insights/suburb-rankings',
    title: 'Suburb Rankings',
    description: 'Compare prices across Perth',
    icon: 'map',
  },
  {
    href: '/insights/venue-breakdown',
    title: 'Venue Breakdown',
    description: 'See what the pub data shows',
    icon: 'venue',
  },
] as const

export function isCanonicalPubLinkEligible(
  pub: Pick<Pub, 'slug' | 'suburb' | 'businessStatus'>,
): boolean {
  return pub.businessStatus !== 'CLOSED_PERMANENTLY'
    && pub.slug.trim().length > 0
    && pub.suburb.trim().length > 0
}

export function getPubContextLinks(pub: Pick<Pub, 'suburb'>) {
  return [
    { href: suburbUrl(pub.suburb), label: `All ${pub.suburb} pub prices` },
    { href: DISCOVER_BEST_BUYS_HREF, label: "Perth's cheapest pints" },
    { href: '/happy-hour', label: 'Happy hours across Perth' },
  ]
}

export const SUBURB_CONTEXT_LINKS = [
  { href: DISCOVER_BEST_BUYS_HREF, label: "Perth's cheapest pints" },
  { href: '/insights/suburb-rankings', label: 'Compare every suburb' },
  { href: '/happy-hour', label: 'Happy hours across Perth' },
] as const
