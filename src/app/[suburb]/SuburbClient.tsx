import Link from 'next/link'
import { CheckCircle2, HelpCircle } from 'lucide-react'
import { Pub } from '@/types/pub'
import { SuburbInfo } from '@/lib/supabase'
import { getFreshness, formatVerifiedDate, FreshnessLevel } from '@/lib/freshness'
import { suburbObservation } from '@/lib/suburbObservation'
import { getSuburbStory } from '@/lib/suburbStory'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { SUBURB_CONTEXT_LINKS } from '@/lib/internalLinks'

interface SuburbClientProps {
  suburb: SuburbInfo
  pubs: Pub[]
  nearbySuburbs: SuburbInfo[]
  perthAvgPrice: number
  suburbSlug: string
}

const freshnessIcons: Record<FreshnessLevel, React.ReactNode> = {
  verified: <CheckCircle2 className="w-3 h-3" />,
  unknown: <HelpCircle className="w-3 h-3" />,
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? `$${value.toFixed(0)}` : `$${value.toFixed(2)}`
}

export default function SuburbClient({ suburb, pubs, nearbySuburbs, perthAvgPrice, suburbSlug }: SuburbClientProps) {
  const story = getSuburbStory({ suburb, pubs, nearbySuburbs, perthAvgPrice, suburbSlug })

  const avgNum = story.suburbAvgPrice ?? 0
  const priceDiff = avgNum > 0 && perthAvgPrice > 0 ? ((avgNum - perthAvgPrice) / perthAvgPrice * 100) : 0
  const isCheaper = priceDiff < 0
  const diffText = avgNum > 0
    ? `${Math.abs(Math.round(priceDiff))}% ${isCheaper ? 'cheaper' : 'more expensive'} than Perth average`
    : null

  // ─── Answer-first lead (content-pack §6) ───
  const cheapestNum = story.minPrice ?? 0
  const cheapestPubObj = story.cheapestPub
  const hasLead = cheapestNum > 0 && avgNum > 0 && !!cheapestPubObj
  const leadDelta = hasLead ? avgNum - cheapestNum : 0
  const checkedDate = cheapestPubObj?.lastVerified
    ? new Date(cheapestPubObj.lastVerified).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
    : null
  const observation = suburbObservation({
    happyHourNowCount: pubs.filter(p => p.isHappyHourNow).length,
    verifiedPrices: story.verifiedPubs.map(p => p.regularPrice as number),
    pubCount: suburb.pubCount,
  })
  const neighbours = nearbySuburbs.slice(0, 2)

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav
        breadcrumbs={[
          { label: 'Suburbs', href: '/suburbs' },
          { label: suburb.name },
        ]}
      />

      {/* Hero Stats */}
      <section className="max-w-container mx-auto px-6 pt-6 pb-6">
        <h1 className="type-hero mb-2">
          Pints in {suburb.name}
        </h1>
        <p className="text-gray-mid text-[0.85rem] mb-6">
          {suburb.pubCount} {suburb.pubCount === 1 ? 'venue' : 'venues'} tracked
          {suburb.happyHourCount > 0 && ` · ${suburb.happyHourCount} with happy hours`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cheapest', value: story.minPrice !== null ? formatPrice(story.minPrice) : 'TBC', accent: true, link: story.cheapestPub ? `/${suburbSlug}/${story.cheapestPub.slug}` : null, linkLabel: story.cheapestPub?.name },
            { label: 'Average', value: avgNum > 0 ? formatPrice(avgNum) : 'TBC', accent: false, extra: diffText },
            { label: 'Most Expensive', value: story.maxPrice !== null ? formatPrice(story.maxPrice) : 'TBC', accent: false },
            { label: 'Happy Hours', value: String(suburb.happyHourCount), accent: false, extra: `of ${suburb.pubCount} venues` },
          ].map((stat) => (
            <div key={stat.label} className={`border-3 border-ink rounded-card px-4 py-4 shadow-hard-sm ${stat.accent ? 'bg-amber' : 'bg-white'}`}>
              <p className={`type-eyebrow ${stat.accent ? 'text-white/75' : 'text-gray-mid'} mb-1`}>{stat.label}</p>
              <p className={`type-price text-[1.5rem] ${stat.accent ? 'text-white' : 'text-ink'}`}>
                {stat.value}
              </p>
              {stat.link && stat.linkLabel && (
                <Link href={stat.link} className={`text-[0.65rem] mt-1 block truncate no-underline ${stat.accent ? 'text-white/80 hover:text-white' : 'text-amber hover:underline'}`}>
                  {stat.linkLabel}
                </Link>
              )}
              {stat.extra && !stat.link && (
                <p className={`text-[0.65rem] mt-1 ${isCheaper && stat.label === 'Average' ? 'text-green' : 'text-gray-mid'}`}>
                  {stat.label === 'Average' && isCheaper ? '↓ ' : stat.label === 'Average' && !isCheaper ? '↑ ' : ''}{stat.extra}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Answer-first lead (content-pack §6) — data-fed, truthful absence */}
        <p className="font-body text-[0.9rem] leading-relaxed text-ink mt-5">
          {hasLead ? (
            <>
              The cheapest pint in {suburb.name} is <span className="font-mono font-bold">{formatPrice(cheapestNum)}</span>
              <> at <Link href={`/${suburbSlug}/${cheapestPubObj.slug}`} className="text-amber font-bold hover:underline">{cheapestPubObj.name}</Link>{checkedDate ? <>, checked {checkedDate}</> : null}</>
              {leadDelta >= 0.5
                ? <> — <span className="font-mono font-bold">{formatPrice(leadDelta)}</span> under the checked suburb average of {formatPrice(avgNum)} across {story.verifiedCount} {story.verifiedCount === 1 ? 'pub' : 'pubs'}.</>
                : <> — about the {formatPrice(avgNum)} checked average across {story.verifiedCount} {story.verifiedCount === 1 ? 'pub' : 'pubs'}.</>}
              {observation && <> {observation}</>}
              {neighbours.length > 0 && (
                <> Or compare checked suburbs nearby in {neighbours.map((ns, i) => (
                  <span key={ns.slug}>{i > 0 ? ' or ' : ''}<Link href={`/${ns.slug}`} className="text-amber font-bold hover:underline">{ns.name}</Link></span>
                ))}.</>
              )}
            </>
          ) : (
            <>
              {suburb.name} has {suburb.pubCount} {suburb.pubCount === 1 ? 'venue' : 'venues'} tracked, but no verified pint price here yet.
              {neighbours.length > 0 && (
                <> Try nearby {neighbours.map((ns, i) => (
                  <span key={ns.slug}>{i > 0 ? ' or ' : ''}<Link href={`/${ns.slug}`} className="text-amber font-bold hover:underline">{ns.name}</Link></span>
                ))}, or report a price if you know one.</>
              )}
            </>
          )}
        </p>
      </section>

      {/* Local guide modules — rendered only from checked suburb data */}
      <section className="max-w-container mx-auto px-6 pb-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {story.cards.map((card, i) => (
            <article
              key={card.id}
              className={`min-w-0 border-3 border-ink rounded-card bg-white p-4 shadow-hard-sm${
                i === story.cards.length - 1 && story.cards.length % 2 === 1 ? ' sm:col-span-2' : ''
              }`}
            >
              <p className="type-eyebrow mb-1">{card.label}</p>
              <h2 className="font-mono text-[1.05rem] font-extrabold leading-tight text-ink mb-2">{card.title}</h2>
              <p className="text-[0.78rem] leading-relaxed text-gray-mid">{card.body}</p>
              {card.href && card.linkLabel && (
                <Link href={card.href} className="mt-3 inline-flex font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-amber hover:text-ink transition-colors no-underline">
                  {card.linkLabel}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Happy Hours Today — highlighted section for pubs with active deals */}
      {(() => {
        const activeHH = pubs.filter(p => p.isHappyHourNow)
        if (activeHH.length === 0) return null
        return (
          <section className="max-w-container mx-auto px-6 pb-4">
            <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 bg-red-pale border-b-3 border-ink">
                <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
                <h2 className="type-card-header text-red">
                  Happy Hour Live Now
                </h2>
                <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-red/70 ml-auto">{activeHH.length} {activeHH.length === 1 ? 'venue' : 'venues'}</span>
              </div>
              <div className="divide-y divide-gray-light">
                {activeHH.map(pub => (
                  <Link
                    key={pub.id}
                    href={`/${suburbSlug}/${pub.slug}`}
                    className="flex items-center justify-between px-4 py-3 no-underline group hover:bg-off-white transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.82rem] font-extrabold text-ink group-hover:text-red transition-colors truncate">{pub.name}</p>
                      <p className="text-[0.65rem] text-red font-bold">{pub.happyHour}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      {pub.happyHourPrice != null && (
                        <p className="font-mono text-[1rem] font-extrabold text-red">${pub.happyHourPrice.toFixed(2)}</p>
                      )}
                      {pub.price != null && pub.happyHourPrice != null && pub.price > pub.happyHourPrice && (
                        <p className="text-[0.6rem] text-gray-mid line-through">${pub.price.toFixed(2)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Pub Table (desktop) + Card List (mobile) */}
      <section id="all-venues" className="max-w-container mx-auto px-6 pb-6 scroll-mt-6">
        <div className="border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-light flex items-center justify-between gap-3">
            <h2 className="type-card-header">All Venues - Cheapest First</h2>
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-gray-mid">All {pubs.length} listed</span>
          </div>

          {/* Desktop table */}
          <div className="hidden max-h-[720px] overflow-y-auto sm:block">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-off-white text-gray-mid font-mono text-[0.65rem] uppercase tracking-wider">
                  <th className="px-3 py-2.5 text-left font-bold w-[40px]">#</th>
                  <th className="px-3 py-2.5 text-left font-bold">Venue</th>
                  <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap w-[90px]">Pint Price</th>
                  <th className="px-3 py-2.5 text-center font-bold whitespace-nowrap hidden lg:table-cell w-[100px]">Status</th>
                  <th className="px-3 py-2.5 text-left font-bold hidden md:table-cell whitespace-nowrap w-[150px]">Happy Hour</th>
                </tr>
              </thead>
              <tbody>
                {pubs.map((pub, i) => {
                  const freshness = getFreshness(pub.lastVerified)
                  return (
                    <tr key={pub.id} className={`border-t border-gray-light hover:bg-off-white transition-colors ${i === 0 ? 'bg-amber/5' : ''}`}>
                      <td className="px-3 py-3 font-mono text-[0.7rem] font-bold text-gray-mid">{i + 1}</td>
                      <td className="px-3 py-3">
                        <Link href={`/${suburbSlug}/${pub.slug}`} className="font-mono text-[0.8rem] font-extrabold text-ink hover:text-amber transition-colors no-underline">
                          {pub.name}
                        </Link>
                        <p className="text-[0.7rem] text-gray-mid mt-0.5 truncate">{pub.address}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {pub.price !== null && pub.priceVerified ? (
                          <span className="font-mono font-extrabold text-ink text-base">
                            ${pub.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="font-mono text-[0.7rem] font-bold text-gray-mid">TBC</span>
                        )}
                        {pub.beerType && (
                          <p className="text-[0.6rem] text-gray-mid mt-0.5">{pub.beerType}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${freshness.bgColor} ${freshness.color} border ${freshness.borderColor}`}>
                          {freshnessIcons[freshness.level]} {freshness.label}
                        </span>
                        <p className="text-[0.6rem] text-gray-mid mt-0.5">{formatVerifiedDate(pub.lastVerified)}</p>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {pub.happyHour ? (
                          <span className="text-[0.7rem] text-red font-bold block truncate" title={pub.happyHour ?? undefined}>{pub.happyHour}</span>
                        ) : (
                          <span className="text-[0.7rem] text-gray-mid">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="max-h-[640px] overflow-y-auto sm:hidden">
            {pubs.map((pub, i) => (
              <Link
                key={pub.id}
                href={`/${suburbSlug}/${pub.slug}`}
                className={`flex items-center justify-between px-4 py-3.5 no-underline group ${
                  i > 0 ? 'border-t border-gray-light' : ''
                } ${i === 0 ? 'bg-amber/5' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.65rem] font-bold text-gray-mid w-4 flex-shrink-0">{i + 1}</span>
                    <p className="font-mono text-[0.82rem] font-extrabold text-ink group-hover:text-amber transition-colors truncate">{pub.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-6 mt-0.5">
                    {pub.happyHour && (
                      <span className="text-[0.65rem] font-bold text-red">{pub.happyHour}</span>
                    )}
                    {pub.beerType && !pub.happyHour && (
                      <span className="text-[0.65rem] text-gray-mid">{pub.beerType}</span>
                    )}
                  </div>
                </div>
                <span className={`font-mono text-[1rem] font-extrabold ml-3 flex-shrink-0 ${
                  pub.price !== null && pub.priceVerified ? 'text-ink' : 'text-gray-mid text-[0.8rem]'
                }`}>
                  {pub.price !== null && pub.priceVerified ? `$${pub.price.toFixed(2)}` : 'TBC'}
                </span>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* Nearby Suburbs */}
      {nearbySuburbs.length > 0 && (
        <section className="max-w-container mx-auto px-6 pb-6">
          <div className="border-3 border-ink rounded-card bg-white shadow-hard-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-light flex items-center justify-between gap-3">
              <h2 className="type-card-header">Nearby suburbs</h2>
              <Link href="/insights/suburb-rankings" className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-amber no-underline hover:underline">
                See all suburb rankings
              </Link>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {nearbySuburbs.map(ns => (
                <Link
                  key={ns.slug}
                  href={`/${ns.slug}`}
                  className="border-2 border-gray-light rounded-pill px-3.5 py-1.5 hover:border-ink hover:bg-off-white transition-all no-underline group"
                >
                  <span className="font-mono text-[0.72rem] font-bold text-ink group-hover:text-amber transition-colors">{ns.name}</span>
                  <span className="text-[0.62rem] text-gray-mid ml-1.5">
                    {ns.pubCount} {ns.pubCount === 1 ? 'pub' : 'pubs'}
                    {ns.cheapestPrice !== 'TBC' && ` · from $${ns.cheapestPrice}`}
                    {avgNum > 0 && Number(ns.avgPrice) > 0 && (
                      Number(ns.avgPrice) < avgNum
                        ? <span className="text-green ml-1">cheaper</span>
                        : Number(ns.avgPrice) > avgNum
                          ? <span className="text-red/70 ml-1">pricier</span>
                          : null
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="suburb-links" className="max-w-container mx-auto px-6 pb-6 scroll-mt-6">
        <div className="border-3 border-ink rounded-card bg-amber-pale p-5 shadow-hard-sm">
          <h2 className="type-card-header">Keep comparing</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUBURB_CONTEXT_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-pill border-2 border-ink bg-white px-3.5 py-2 font-mono text-[0.7rem] font-bold text-ink no-underline transition-colors hover:bg-ink hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      {story.faqs.length > 0 && (
        <section className="max-w-container mx-auto px-6 pb-6">
          <div className="border-3 border-ink rounded-card bg-off-white shadow-hard-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-light">
              <h2 className="type-card-header">{suburb.name} pint FAQ</h2>
            </div>
            <dl className="divide-y divide-gray-light">
              {story.faqs.map(item => (
                <div key={item.question} className="px-4 py-4">
                  <dt className="font-mono text-[0.82rem] font-extrabold leading-snug text-ink">{item.question}</dt>
                  <dd className="mt-1 text-[0.78rem] leading-relaxed text-gray-mid">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="max-w-container mx-auto px-6 pb-8">
        <div className="bg-ink border-3 border-ink rounded-card p-6 text-center shadow-hard-sm">
          <h2 className="type-section text-white mb-2">Know a price in {suburb.name}?</h2>
          <p className="text-white/60 text-sm mb-4">Help us keep {suburb.name} pint prices accurate.</p>
          <Link
            href="/?submit=1"
            className="inline-flex font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
          >
            Report a price
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
