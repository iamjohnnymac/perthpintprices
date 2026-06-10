import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, ClipboardCheck, Tv } from 'lucide-react'
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd'
import Footer from '@/components/Footer'
import SubPageNav from '@/components/SubPageNav'
import TeamStripes from '@/components/TeamStripes'
import WorldCupCountdown from '@/components/WorldCupCountdown'
import WorldCupFixtures from '@/components/WorldCupFixtures'
import { formatAudPrice } from '@/lib/pintPriceStats'
import { getPubs } from '@/lib/supabase'
import { BASE_URL, pubUrl } from '@/lib/urls'
import {
  WC_FIXTURES,
  CONFIRMED_OPENINGS,
  FORM_GUIDE_SLUGS,
  TIMES_CHECKED,
  TRADING_BADGES,
  formatDayHeading,
  formatKickoff,
  fixtureDay,
} from '@/lib/worldCup'
import type { Pub } from '@/types/pub'

const canonical = `${BASE_URL}/world-cup`
const description = 'Every 2026 World Cup kickoff in Perth time, which pubs can legally pour when, and confirmed early opens — checked and dated. All matches free on SBS.'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Where to Watch the 2026 World Cup in Perth',
  description,
  alternates: { canonical },
  openGraph: {
    title: 'Where to Watch the 2026 World Cup in Perth | Perth Pint Prices',
    description,
    url: canonical,
    type: 'website',
    siteName: 'Perth Pint Prices',
    locale: 'en_AU',
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Perth Pint Prices World Cup guide' }],
  },
  twitter: { card: 'summary_large_image' },
}

const FAQ_ITEMS = [
  {
    question: 'What time is USA v Australia in Perth?',
    answer: '3am AWST on Saturday 20 June 2026. The kickoff is Friday lunchtime in Seattle, which lands in the middle of the night here — only venues holding a World Cup extended trading permit can legally pour at that hour.',
  },
  {
    question: 'Can Perth pubs legally open for 3am World Cup games?',
    answer: 'Only with a permit. Standard WA hotel, tavern and small bar licences trade 6am to midnight Monday to Saturday and from 10am on Sunday. On 5 June 2026 the WA Director of Liquor Licensing opened extended-trading applications for venues showing World Cup matches live — approved venues can trade until 30 minutes after full-time.',
  },
  {
    question: 'What channel is the 2026 World Cup on in Australia?',
    answer: 'Every match is free on SBS and SBS On Demand.',
  },
  {
    question: 'What time do 2026 World Cup matches kick off in Perth?',
    answer: 'Between midnight and midday AWST. Perth sits 12 to 15 hours ahead of the North American host cities, so there are no evening kickoffs for the entire tournament.',
  },
]

const SOCCEROOS_NOTES: Record<string, string> = {
  '2026-06-14-australia-turkiye': 'Saturday night in Vancouver lands as Sunday lunch here. Any pub with a screen can show it — pick a good room.',
  '2026-06-20-usa-australia': 'The brutal one. 3am is permit hours, so the rooms showing it live have done the paperwork. Expect a short list.',
  '2026-06-26-paraguay-australia': 'Mid-morning Friday. Legal everywhere from 6am — but earlier than many doors actually open, so check first.',
}

function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'date TBC'
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Perth' })
}

export default async function WorldCupPage() {
  const pubs = await getPubs()
  const bySlug = new Map(pubs.map(pub => [pub.slug, pub]))
  const formGuide = FORM_GUIDE_SLUGS
    .map(slug => bySlug.get(slug))
    .filter((pub): pub is Pub => Boolean(pub))
  const socceroos = WC_FIXTURES.filter(f => f.socceroos)
  const renderedAtIso = new Date().toISOString()

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd()).replace(/</g, '\\u003c') }}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: BASE_URL },
        { name: 'Where to watch the 2026 World Cup in Perth', url: canonical },
      ]} />
      <SubPageNav breadcrumbs={[{ label: 'World Cup' }]} />

      <section className="max-w-container mx-auto px-6 pt-8 pb-12">
        <p className="mb-3 type-eyebrow">World Cup 2026 · 11 June – 19 July</p>
        <h1 className="type-hero-editorial">Where to watch the 2026 World Cup in Perth</h1>
        <p className="mt-5 max-w-[640px] font-body text-[0.98rem] leading-relaxed text-gray-mid">
          Perth sits 12 to 15 hours ahead of every host city, so all 104 matches land between midnight
          and midday AWST — there is no evening kickoff for the entire tournament. Every match is free
          on SBS, so a pub has to be worth getting out of bed for. This page keeps the kickoffs in Perth
          time, shows which hours a venue can legally pour, and lists confirmed early opens with the
          date we checked them.
        </p>

        <section className="my-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Every kickoff</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">12am–12pm</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">All 104 matches land between midnight and midday, Perth time.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Standard pour, Mon–Sat</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">6am</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Hotel, tavern and small bar licences trade 6am–midnight. Sunday starts at 10am.</p>
          </div>
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <p className="type-eyebrow">Before 6am</p>
            <p className="mt-2 font-mono text-3xl font-extrabold text-ink">Permit</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">Venues can apply to trade until 30 min after full-time while the broadcast runs.</p>
          </div>
        </section>
        <p className="font-mono text-[0.68rem] text-gray-mid -mt-4 mb-8">
          Licensing position checked {TIMES_CHECKED} — WA Director of Liquor Licensing announcement, 5 June 2026.
        </p>

        <section className="mb-10" aria-labelledby="socceroos-heading">
          <h2 id="socceroos-heading" className="type-section mb-4">The Socceroos, in Perth time</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {socceroos.map(fixture => (
              <div key={fixture.id} className="overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
                <TeamStripes home={fixture.home} away={fixture.away} />
                <div className="p-5">
                  <p className="type-eyebrow">{formatDayHeading(fixtureDay(fixture.kickoff))}</p>
                  <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatKickoff(fixture.kickoff)}</p>
                  <p className="mt-1 font-mono text-[0.82rem] font-bold text-ink">{fixture.home} v {fixture.away}</p>
                  <WorldCupCountdown
                    kickoff={fixture.kickoff}
                    prefix="Kicks off in "
                    className="mt-2 block min-h-[1.1rem] font-mono text-[0.72rem] font-bold text-amber"
                  />
                  <p className="mt-2 text-[0.76rem] leading-relaxed text-gray-mid">{SOCCEROOS_NOTES[fixture.id]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm" aria-labelledby="confirmed-heading">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-amber-light" />
            <div className="min-w-0 flex-1">
              <p className="type-eyebrow text-white/55">Checked and dated</p>
              <h2 id="confirmed-heading" className="mt-2 type-section text-white">Confirmed early opens</h2>
              {CONFIRMED_OPENINGS.length === 0 ? (
                <>
                  <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
                    None confirmed yet — checked {TIMES_CHECKED}. When a venue confirms a door time for a
                    specific match, it gets listed here with the date we checked, same as every pint price
                    on this site. No venue gets listed on a maybe.
                  </p>
                  <Link
                    href="/?submit=1"
                    className="mt-4 inline-block rounded-pill border-3 border-white/90 bg-amber px-5 py-2.5 font-mono text-[0.72rem] font-bold uppercase tracking-[0.06em] text-white no-underline shadow-hard-sm hover:bg-amber-light"
                  >
                    Tell us about an early open
                  </Link>
                </>
              ) : (
                <ul className="mt-3 divide-y divide-white/15">
                  {CONFIRMED_OPENINGS.map(opening => {
                    const fixture = WC_FIXTURES.find(f => f.id === opening.fixtureId)
                    return (
                      <li key={`${opening.venue}-${opening.fixtureId}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
                        <span className="font-mono text-[0.86rem] font-extrabold">{opening.venue}</span>
                        <span className="text-[0.72rem] text-white/55">{opening.suburb}</span>
                        {fixture && (
                          <span className="text-[0.78rem] text-white/70">
                            {fixture.home} v {fixture.away}, {formatKickoff(fixture.kickoff)} {formatDayHeading(fixtureDay(fixture.kickoff))}
                          </span>
                        )}
                        <span className="font-mono text-[0.78rem] font-bold text-amber-light">{opening.doors}</span>
                        <span className="text-[0.68rem] text-white/45">Confirmed {opening.confirmedAt} · {opening.source}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="mb-10" aria-labelledby="fixtures-heading">
          <h2 id="fixtures-heading" className="type-section mb-2">Every group game, Perth time</h2>
          <p className="mb-4 max-w-[640px] font-body text-[0.88rem] leading-relaxed text-gray-mid">
            Times converted from the confirmed schedule and checked on {TIMES_CHECKED}. Each match carries
            its trading window: <span className="font-mono font-bold text-amber">permit hours</span> means
            only venues holding the World Cup extended trading permit can pour,{' '}
            <span className="font-mono font-bold text-ink">early doors</span> means legal from 6am on a
            standard licence but earlier than most pubs open, and{' '}
            <span className="font-mono font-bold text-gray-mid">normal trading</span> means any licensed
            venue can show it. Knockout kickoffs get added once the bracket settles — we list nothing TBC.
          </p>
          <WorldCupFixtures renderedAtIso={renderedAtIso} />
        </section>

        <section className="mb-10" aria-labelledby="form-guide-heading">
          <div className="rounded-card border-3 border-ink bg-white shadow-hard-sm">
            <div className="border-b-3 border-ink bg-off-white px-5 py-4">
              <p className="type-eyebrow">Form, not confirmations</p>
              <h2 id="form-guide-heading" className="mt-1 type-section">The screens form guide</h2>
              <p className="mt-2 max-w-[560px] text-[0.78rem] leading-relaxed text-gray-mid">
                The rooms with form for live sport, with what a pint costs at each. None of these are
                confirmed World Cup openings — the confirmed list above is the real thing. Run one of
                these venues and opening early? Tell us and we will check it and list you.
              </p>
            </div>
            <div className="divide-y divide-gray-light">
              {formGuide.map(pub => (
                <Link key={pub.id} href={pubUrl(pub)} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 no-underline hover:bg-off-white">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[0.86rem] font-extrabold text-ink group-hover:text-amber">{pub.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-gray-mid">
                      <span>{pub.suburb}</span>
                      {pub.regularPrice != null && <span>Checked {formatDate(pub.lastVerified ?? pub.priceVerifiedAt)}</span>}
                    </span>
                  </span>
                  {pub.regularPrice != null ? (
                    <span className="font-mono text-lg font-extrabold text-ink">{formatAudPrice(pub.regularPrice)}</span>
                  ) : (
                    <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.06em] text-gray-mid">No checked price yet</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="mb-3 flex items-center gap-2">
              <Tv className="h-4 w-4 text-amber" />
              <h2 className="font-mono text-lg font-extrabold text-ink">The free options</h2>
            </div>
            <p className="font-body text-[0.85rem] leading-relaxed text-gray-mid">
              Every match is on SBS and SBS On Demand for nothing. Northbridge Piazza is putting key
              fixtures, including the Socceroos games, on its public screen, with Football West and
              Perth Glory running fan activities for the Australia matches — and every pub we track
              in <Link href="/northbridge" className="font-bold text-ink hover:text-amber">Northbridge</Link> is
              a short walk from it.
            </p>
          </div>

          <div className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-amber" />
              <h2 className="font-mono text-lg font-extrabold text-ink">Picking a real early open</h2>
            </div>
            <p className="font-body text-[0.85rem] leading-relaxed text-gray-mid">
              A real early open is specific: the venue names the match and the door time, not just a
              generic World Cup graphic. For anything before 6am, ask if they have the extended trading
              permit — paperwork beats an Instagram post. And a pint at 7am costs the same as a pint
              at 7pm; nobody runs a breakfast discount.
            </p>
          </div>
        </section>

        <section className="mb-10 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="type-section mb-4">Quick answers</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map(item => (
              <div key={item.question}>
                <h3 className="type-card">{item.question}</h3>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
          <p className="type-eyebrow">Keep going</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { href: '/happy-hour', label: 'Happy hours for after the match' },
              { href: '/discover', label: 'Find a pub near you' },
              { href: '/cheapest-pints', label: 'Cheapest pints in Perth' },
              { href: '/northbridge', label: 'Northbridge pint prices' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-card border border-gray-light px-4 py-3 font-mono text-[0.76rem] font-bold text-ink no-underline hover:border-amber hover:text-amber">
                {link.label}<ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}
