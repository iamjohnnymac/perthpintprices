import Link from 'next/link'
import type { Pub } from '@/types/pub'
import { pubUrl } from '@/lib/urls'

type GuideKind = 'cozy' | 'sunset' | 'tab'

const COPY: Record<GuideKind, { eyebrow: string; heading: string; method: string; links: Array<{ href: string; label: string }> }> = {
  cozy: {
    eyebrow: 'Checked picks',
    heading: 'Cosy corners in Perth: a quiet shortlist for bad weather',
    method: 'These are venues currently tagged as cosy in our dataset, with a listed pint price. They are ordered by that listed price; the local sort can change once you share your location.',
    links: [
      { href: '/happy-hour', label: 'Happy hours running now' },
      { href: '/guides/beer-weather', label: 'Beer weather guide' },
      { href: '/discover', label: 'Browse every pub' },
    ],
  },
  sunset: {
    eyebrow: 'Checked picks',
    heading: 'Sunset sippers in Perth: three places to start before golden hour',
    method: 'These are venues currently tagged for sunset, with a listed pint price. They are ordered by that listed price; this is a view-and-price shortlist, not a guarantee of a free table or clear sky.',
    links: [
      { href: '/happy-hour', label: 'Happy hours running now' },
      { href: '/guides/beer-weather', label: 'Check the beer weather' },
      { href: '/discover', label: 'Browse every pub' },
    ],
  },
  tab: {
    eyebrow: 'Checked picks',
    heading: 'Perth pubs with TAB: three places with a listed pint price',
    method: 'These venues are marked as having TAB on-site and have a listed pint price. They are ordered by that price; race times and TAB availability are checked separately on the live board below.',
    links: [
      { href: '/happy-hour', label: 'Happy hours running now' },
      { href: '/insights/tonights-best-bets', label: "Tonight's best bets" },
      { href: '/discover', label: 'Browse every pub' },
    ],
  },
}

function listedPrice(pub: Pub) {
  return pub.price === null ? 'Price to be confirmed' : `$${pub.price.toFixed(2)} listed pint`
}

function checkedDate(pub: Pub) {
  const value = pub.lastVerified ?? pub.priceVerifiedAt
  if (!value) return 'Date not yet recorded'
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' }).format(new Date(value))
}

export default function GuideEvidence({ kind, pubs }: { kind: GuideKind; pubs: Pub[] }) {
  const copy = COPY[kind]
  const picks = pubs
    .filter((pub) => (kind === 'cozy' ? pub.cozyPub : kind === 'sunset' ? pub.sunsetSpot : pub.hasTab) && pub.price !== null)
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    .slice(0, 3)

  return (
    <section className="max-w-container mx-auto px-6 pt-8 sm:pt-12" aria-labelledby={`${kind}-evidence-heading`}>
      <div className="border-3 border-ink rounded-card bg-white p-5 shadow-hard-sm sm:p-6">
        <p className="type-eyebrow mb-2">{copy.eyebrow}</p>
        <h1 id={`${kind}-evidence-heading`} className="type-hero text-[2.1rem] sm:text-[2.8rem]">{copy.heading}</h1>
        <p className="mt-3 max-w-[680px] font-body text-[0.9rem] leading-relaxed text-gray-mid">{copy.method}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {picks.map((pub) => (
            <Link key={pub.id} href={pubUrl(pub)} className="rounded-card border-2 border-ink bg-off-white p-3 no-underline transition-colors hover:bg-amber-pale">
              <span className="block font-body text-sm font-bold text-ink">{pub.name}</span>
              <span className="mt-1 block font-mono text-[0.68rem] font-bold text-amber">{pub.suburb} · {listedPrice(pub)}</span>
              <span className="mt-1 block font-body text-[0.68rem] text-gray-mid">Last checked: {checkedDate(pub)}</span>
            </Link>
          ))}
        </div>
        <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-2" aria-label="Related guides">
          {copy.links.map((link) => <Link key={link.href} href={link.href} className="font-mono text-[0.68rem] font-bold uppercase tracking-wide text-amber hover:underline">{link.label}</Link>)}
        </nav>
      </div>
    </section>
  )
}
