'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { getPubs } from '@/lib/supabase'
import { Pub } from '@/types/pub'
import { pubUrl } from '@/lib/urls'
import { resizeGooglePhoto } from '@/lib/pubPhoto'
import { getHappyHourStatus, formatHappyHourDays, type HappyHourStatus } from '@/lib/happyHourLive'
import { HAPPY_HOUR_DAYS } from '@/lib/happyHourDays'
import { happyHourPourLabel, isPintHappyHour } from '@/lib/happyHourPour'
import { perthRegion, PERTH_REGION_ORDER, type PerthRegion } from '@/lib/perthRegions'

interface HappyHourClientProps {
  initialPubs: Pub[]
  renderedAtIso: string
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'TBC'
  return Number.isInteger(price) ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`
}

// Format a 24h time string ("17:30") to "5:30pm" / "5pm" (minutes preserved).
function formatHHTime(value: string | null): string {
  if (!value) return ''
  const [h, m = '0'] = value.split(':')
  const hour = Number(h)
  const minute = Number(m)
  if (!Number.isFinite(hour)) return ''
  const period = hour >= 12 ? 'pm' : 'am'
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return minute > 0 ? `${h12}:${String(minute).padStart(2, '0')}${period}` : `${h12}${period}`
}

function formatPerthTime(date: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Perth',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(' ', '').toLowerCase()
}

function getPubHappyHourStatus(pub: Pub, now: Date): HappyHourStatus {
  return getHappyHourStatus({
    price: pub.regularPrice,
    happyHourPrice: pub.happyHourPrice,
    happyHourDays: pub.happyHourDays,
    happyHourStart: pub.happyHourStart,
    happyHourEnd: pub.happyHourEnd,
  }, now)
}

function hasTimedHappyHour(pub: Pub): boolean {
  return Boolean(pub.happyHourDays && pub.happyHourStart && pub.happyHourEnd)
}

function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

// A short editorial write-up — a couple of paragraphs — for a venue, composed only
// from real per-pub data: first the deal mechanics (price, pour, window, saving,
// live status), then the venue itself led by its own description or Google summary,
// its amenities and rating. Leading each second paragraph with the pub's own copy
// keeps entries genuinely different rather than templated clones.
function venueWriteUp(pub: Pub, isActive: boolean): string[] {
  const paras: string[] = []
  const hh = pub.happyHourPrice
  const reg = pub.regularPrice
  const pour = happyHourPourLabel(pub.slug) // 'schooner' | 'small pour' | null
  const drink = `${pour ?? 'pint'}s`
  const days = formatHappyHourDays(pub.happyHourDays)
  const daysPhrase = days === '7 days' ? 'every day' : days === 'Weekends' ? 'weekends' : days
  const startT = formatHHTime(pub.happyHourStart)
  const endT = formatHHTime(pub.happyHourEnd)
  const timeRange = startT && endT ? `${startT} to ${endT}` : ''
  const when = [daysPhrase, timeRange].filter(Boolean).join(', ')

  // Paragraph 1 — how the deal works.
  if (hh != null) {
    let deal = `Happy hour drops ${drink} to ${formatPrice(hh)}`
    if (reg != null && reg > hh && !pour) {
      deal += `, down from a regular ${formatPrice(reg)} — a ${formatPrice(reg - hh)} saving on the standard pint`
    }
    deal += '.'
    if (when) deal += ` It runs ${when}.`
    if (pour) deal += ` It's a ${pour} rather than a full pint, so the price reflects the smaller pour.`
    if (isActive) deal += ` Right now, it's pouring.`
    paras.push(deal)
  } else {
    const regNote = reg != null ? ` Regular pints run ${formatPrice(reg)}.` : ''
    paras.push(`This pub runs a happy hour${when ? `, ${when}` : ''}.${regNote} We're still confirming the happy-hour drop price — worth a check before you commit.`)
  }

  // Paragraph 2 — the venue itself, led by its own description where we have one.
  const venueParts: string[] = []
  const lead = pub.description?.trim() || pub.googleEditorialSummary?.trim() || ''
  if (lead) venueParts.push(/[.!?]$/.test(lead) ? lead : `${lead}.`)

  const feats: string[] = []
  if (pub.outdoorSeating) feats.push('a beer garden for pints in the sun')
  if (pub.allowsDogs) feats.push('a welcome for dogs')
  if (pub.goodForWatchingSports) feats.push('the footy on the screens')
  if (pub.servesFood) feats.push('a kitchen')
  if (pub.kidFriendly || pub.goodForChildren) feats.push('room for the kids')
  if (pub.liveMusic) feats.push('live music')
  if (pub.cozyPub && !pub.outdoorSeating) feats.push('a cosy indoor fit-out')
  if (feats.length) venueParts.push(`You'll find ${joinList(feats)}.`)

  if (pub.googleRating != null) {
    venueParts.push(`It rates ${pub.googleRating.toFixed(1)} on Google${pub.googleRatingCount ? ` from ${pub.googleRatingCount.toLocaleString()} reviews` : ''}.`)
  }
  if (venueParts.length) paras.push(venueParts.join(' '))

  return paras
}

export default function HappyHourClient({ initialPubs, renderedAtIso }: HappyHourClientProps) {
  const [happyHourPubs, setHappyHourPubs] = useState<Pub[]>(initialPubs)
  const [allPubs, setAllPubs] = useState<Pub[]>(initialPubs.filter(hasTimedHappyHour))
  const [loading, setLoading] = useState(false) // Start as false since we have server data
  const [clockInstant, setClockInstant] = useState(() => new Date(renderedAtIso))

  const fetchPubs = useCallback(async () => {
    try {
      const pubs = await getPubs()
      const pubsWithHappyHours = pubs.filter((p) => p.happyHour)
      setHappyHourPubs(pubsWithHappyHours)
      setAllPubs(pubsWithHappyHours.filter(hasTimedHappyHour))
    } catch (err) {
      console.error('Error fetching happy hour pubs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Server-rendered data arrives via initialPubs; only poll for live updates.
    const interval = setInterval(fetchPubs, 60_000)
    return () => clearInterval(interval)
  }, [fetchPubs])

  useEffect(() => {
    const interval = setInterval(() => setClockInstant(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Every happy hour pouring this minute, cheapest live drink first — the live
  // "on right now" view that no static competitor listicle can offer.
  const onNow = useMemo(
    () => happyHourPubs
      .map(pub => ({ pub, status: getPubHappyHourStatus(pub, clockInstant) }))
      .filter(e => e.status.isActive)
      .sort((a, b) => (a.status.effectivePrice ?? a.pub.happyHourPrice ?? 999) - (b.status.effectivePrice ?? b.pub.happyHourPrice ?? 999)),
    [happyHourPubs, clockInstant]
  )
  const activeCount = onNow.length
  const ON_NOW_LIMIT = 12

  // Editorial "best of" picks, auto-selected from live data. Only real pints count
  // — schooner/small-pour happy hours are excluded (see happyHourPour) so we never
  // headline a non-pint as the cheapest. Picks are de-duplicated across cards.
  const bestOf = useMemo(() => {
    const priced = allPubs.filter(p => p.happyHourPrice != null)
    const pints = priced.filter(p => isPintHappyHour(p.slug))
    const byPrice = (a: Pub, b: Pub) => (a.happyHourPrice ?? 999) - (b.happyHourPrice ?? 999)
    const cheapestPint = [...pints].sort(byPrice)[0] ?? null
    const biggestSaving = pints
      .filter(p => p.regularPrice != null && p.happyHourPrice != null && p.regularPrice > p.happyHourPrice)
      .sort((a, b) => (b.regularPrice! - b.happyHourPrice!) - (a.regularPrice! - a.happyHourPrice!))[0] ?? null
    const beerGarden = [...pints]
      .filter(p => p.outdoorSeating && p.slug !== cheapestPint?.slug)
      .sort(byPrice)[0] ?? null
    return { cheapestPint, biggestSaving, beerGarden }
  }, [allPubs])

  // Group every timed happy hour into its Perth region, cheapest first within each
  // — the area sections that make this read as a listicle, not a price table.
  const regionGroups = useMemo(() => {
    const entries = allPubs.map(pub => ({ pub, status: getPubHappyHourStatus(pub, clockInstant) }))
    const groups = new Map<PerthRegion, typeof entries>()
    for (const entry of entries) {
      const region = perthRegion(entry.pub.suburb)
      const arr = groups.get(region) ?? []
      arr.push(entry)
      groups.set(region, arr)
    }
    return PERTH_REGION_ORDER
      .filter(region => groups.has(region))
      .map(region => {
        const arr = groups.get(region)!
        arr.sort((a, b) => (a.pub.happyHourPrice ?? a.pub.price ?? 999) - (b.pub.happyHourPrice ?? b.pub.price ?? 999))
        const cheapest = arr.reduce<number | null>((min, e) => {
          const p = e.pub.happyHourPrice ?? e.pub.price
          return p != null && (min == null || p < min) ? p : min
        }, null)
        return { region, entries: arr, cheapest }
      })
  }, [allPubs, clockInstant])

  const cheapestRegion = bestOf.cheapestPint ? perthRegion(bestOf.cheapestPint.suburb) : null

  const faqItems = [
    {
      q: 'What time is happy hour in Perth?',
      a: `Most Perth happy hours run late afternoon to early evening — commonly 4–6pm on weekdays, though some pubs go later or all day. Every venue below lists its exact window${activeCount > 0 ? `, and ${activeCount} ${activeCount === 1 ? 'is' : 'are'} on right now` : ''}.`,
    },
    {
      q: "Where's the cheapest happy-hour pint in Perth?",
      a: bestOf.cheapestPint
        ? `${bestOf.cheapestPint.name} in ${bestOf.cheapestPint.suburb} has the cheapest happy-hour pint we've found — ${formatPrice(bestOf.cheapestPint.happyHourPrice)}. (We don't count schooner or small-pour deals as pints.) You'll find it in the ${cheapestRegion} section below.`
        : 'Each area guide below lists its venues cheapest first, so the best deal is always at the top.',
    },
    {
      q: 'Which Perth pubs have a happy hour?',
      a: `We track ${happyHourPubs.length} Perth pubs with a happy hour, each with a live window and pint price — grouped by area below, from the CBD and Northbridge to Fremantle, the hills and the beaches.`,
    },
  ]
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Happy Hours" />

      <div className="max-w-container mx-auto px-6 py-8">
        {/* Page heading + answer-first intro */}
        <div className="mb-6">
          <h1 className="type-hero">
            Happy hours in Perth
          </h1>

          {activeCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(45,122,61,0.5)] animate-pulse" />
              <span className="font-mono text-[0.75rem] font-bold text-ink">
                {activeCount} on right now
              </span>
            </div>
          )}

          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mt-3">
            Every Perth happy hour we track — {happyHourPubs.length} pubs, each with its exact pint price and window. Most run late afternoon, 4–6pm on weekdays; {activeCount > 0 ? <>{activeCount} {activeCount === 1 ? 'is' : 'are'} live right now</> : 'none are live this minute'}{bestOf.cheapestPint && <>, with pints from <span className="font-mono font-bold text-ink">{formatPrice(bestOf.cheapestPint.happyHourPrice)}</span></>}. Grouped by area below, cheapest first in each — updated continuously.
          </p>

          <p className="text-gray-mid text-[0.7rem] mt-2">
            Live data · auto-refreshes every 60s
          </p>
        </div>

        {/* On right now — the live, cheapest-first list with time left on the clock */}
        {onNow.length > 0 && (
          <section className="mb-8 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green animate-pulse shadow-[0_0_8px_rgba(45,122,61,0.5)]" />
              <h2 className="type-section leading-tight">On right now</h2>
            </div>
            <p className="mt-1 mb-4 font-body text-[0.82rem] leading-relaxed text-gray-mid">
              {activeCount} Perth happy {activeCount === 1 ? 'hour is' : 'hours are'} pouring this minute ({formatPerthTime(clockInstant)} AWST). Cheapest first, with time left on the clock — something no static list can tell you.
            </p>
            <div className="divide-y divide-gray-light">
              {onNow.slice(0, ON_NOW_LIMIT).map(({ pub, status }) => (
                <Link
                  key={pub.id}
                  href={pubUrl(pub)}
                  className="flex items-center gap-3 py-2.5 no-underline group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[0.82rem] font-bold text-ink group-hover:text-amber transition-colors">{pub.name}</span>
                    <span className="ml-2 font-body text-[0.72rem] text-gray-mid">{pub.suburb}</span>
                    {happyHourPourLabel(pub.slug) && (
                      <span className="ml-1 font-body text-[0.72rem] font-bold text-amber">· {happyHourPourLabel(pub.slug)}</span>
                    )}
                  </div>
                  {status.countdown && (
                    <span className="flex-shrink-0 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-green">
                      {status.countdown}
                    </span>
                  )}
                  <span className="w-14 flex-shrink-0 text-right font-mono text-[1.05rem] font-extrabold text-ink">
                    {formatPrice(status.effectivePrice ?? pub.happyHourPrice ?? pub.price)}
                  </span>
                </Link>
              ))}
            </div>
            {onNow.length > ON_NOW_LIMIT && (
              <p className="mt-3 font-body text-[0.76rem] text-gray-mid">
                + {onNow.length - ON_NOW_LIMIT} more pouring now — they&apos;re marked <span className="font-bold text-green">Live</span> in the area guide below.
              </p>
            )}
          </section>
        )}

        {/* Editor's picks — auto-selected from live data, pour-aware */}
        {(bestOf.cheapestPint || bestOf.biggestSaving || bestOf.beerGarden) && (
          <section className="mb-8">
            <h2 className="type-section leading-tight mb-3">Perth&apos;s best happy-hour pints</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {bestOf.cheapestPint && (
                <Link href={pubUrl(bestOf.cheapestPint)} className="block rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm no-underline hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all">
                  <p className="type-eyebrow text-amber">Cheapest pint</p>
                  <p className="mt-1 type-price text-[1.7rem] leading-none">{formatPrice(bestOf.cheapestPint.happyHourPrice)}</p>
                  <p className="mt-2 font-mono text-[0.82rem] font-bold text-ink truncate">{bestOf.cheapestPint.name}</p>
                  <p className="font-body text-[0.76rem] text-gray-mid">{bestOf.cheapestPint.suburb} · {formatHappyHourDays(bestOf.cheapestPint.happyHourDays)} {formatHHTime(bestOf.cheapestPint.happyHourStart)}-{formatHHTime(bestOf.cheapestPint.happyHourEnd)}</p>
                </Link>
              )}
              {bestOf.biggestSaving && (
                <Link href={pubUrl(bestOf.biggestSaving)} className="block rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm no-underline hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all">
                  <p className="type-eyebrow text-amber">Biggest saving</p>
                  <p className="mt-1 type-price text-[1.7rem] leading-none text-green">{formatPrice((bestOf.biggestSaving.regularPrice ?? 0) - (bestOf.biggestSaving.happyHourPrice ?? 0))} off</p>
                  <p className="mt-2 font-mono text-[0.82rem] font-bold text-ink truncate">{bestOf.biggestSaving.name}</p>
                  <p className="font-body text-[0.76rem] text-gray-mid">{formatPrice(bestOf.biggestSaving.happyHourPrice)}, was {formatPrice(bestOf.biggestSaving.regularPrice)} · {bestOf.biggestSaving.suburb}</p>
                </Link>
              )}
              {bestOf.beerGarden && (
                <Link href={pubUrl(bestOf.beerGarden)} className="block rounded-card border-3 border-ink bg-white p-4 shadow-hard-sm no-underline hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all">
                  <p className="type-eyebrow text-amber">Best beer garden</p>
                  <p className="mt-1 type-price text-[1.7rem] leading-none">{formatPrice(bestOf.beerGarden.happyHourPrice)}</p>
                  <p className="mt-2 font-mono text-[0.82rem] font-bold text-ink truncate">{bestOf.beerGarden.name}</p>
                  <p className="font-body text-[0.76rem] text-gray-mid">{bestOf.beerGarden.suburb} · pints in the sun</p>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 border-4 border-gray border-t-amber rounded-full animate-spin" />
            <span className="text-gray-mid font-medium">Loading happy hours...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && regionGroups.length === 0 && (
          <div className="border-3 border-ink rounded-card p-8 text-center shadow-hard-sm">
            <h2 className="font-mono font-extrabold text-xl text-ink mb-3">
              No happy hours right now
            </h2>
            <p className="text-gray-mid text-sm mb-6 max-w-md mx-auto leading-relaxed">
              We couldn&apos;t load the happy-hour list. Try the full price list and keep the pint honest.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              See Perth prices
            </Link>
          </div>
        )}

        {/* The listicle — happy hours grouped by area, cheapest first in each */}
        {!loading && regionGroups.length > 0 && (
          <div className="mb-4">
            {regionGroups.map(group => (
              <section key={group.region} className="mb-9">
                <div className="flex items-baseline justify-between gap-3 border-b-3 border-ink pb-2">
                  <h2 className="type-section leading-tight">{group.region}</h2>
                  <span className="flex-shrink-0 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-gray-mid">
                    {group.entries.length} {group.entries.length === 1 ? 'spot' : 'spots'}
                  </span>
                </div>
                <p className="mt-2 mb-1 font-body text-[0.8rem] text-gray-mid">
                  {group.entries.length} happy {group.entries.length === 1 ? 'hour' : 'hours'} across {group.region}
                  {group.cheapest != null && <>, with pints from <span className="font-mono font-bold text-ink">{formatPrice(group.cheapest)}</span></>}.
                </p>

                <div>
                  {group.entries.map(({ pub, status }) => (
                    <div key={pub.id} className="py-4 border-b border-gray-light last:border-b-0">
                      {(pub.googlePhotoUrl || pub.imageUrl) && (
                        <figure className="mb-3">
                          {/* Plain img on purpose: Google photos must be hotlinked + refreshed, not re-hosted/optimised on our CDN. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resizeGooglePhoto(pub.googlePhotoUrl || pub.imageUrl)!}
                            alt={`${pub.name}, ${pub.suburb}`}
                            loading="lazy"
                            className="h-48 w-full rounded-card border-3 border-ink object-cover"
                          />
                          <figcaption className="mt-1 text-right font-body text-[0.6rem] text-gray-mid">
                            {pub.googlePhotoUrl ? (
                              <>
                                Photo:{' '}
                                {pub.googlePhotoAttributionUri ? (
                                  <a href={pub.googlePhotoAttributionUri} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-amber">
                                    {pub.googlePhotoAttribution || 'contributor'}
                                  </a>
                                ) : (
                                  pub.googlePhotoAttribution || 'contributor'
                                )}{' '}
                                · Google Maps
                              </>
                            ) : (
                              <>Photo: courtesy of {pub.name}</>
                            )}
                          </figcaption>
                        </figure>
                      )}
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="type-card leading-snug min-w-0">
                          <Link href={pubUrl(pub)} className="text-ink hover:text-amber no-underline">
                            {pub.name}
                          </Link>
                          <span className="ml-2 font-body text-[0.72rem] font-normal text-gray-mid">{pub.suburb}</span>
                        </h3>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {status.isActive && (
                            <span className="inline-flex items-center gap-1 font-mono text-[0.58rem] font-bold uppercase tracking-wider text-green">
                              <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
                              Live
                            </span>
                          )}
                          <span className="font-mono text-[1.15rem] font-extrabold text-ink">
                            {formatPrice(pub.happyHourPrice ?? pub.price)}
                          </span>
                        </div>
                      </div>
                      {venueWriteUp(pub, status.isActive).map((para, idx) => (
                        <p key={idx} className={`font-body text-[0.85rem] leading-relaxed text-gray-mid ${idx === 0 ? 'mt-1.5' : 'mt-2'}`}>
                          {para}
                        </p>
                      ))}
                      {pub.address && (
                        <p className="mt-2 font-body text-[0.72rem] text-gray-mid">{pub.address}</p>
                      )}
                      {pub.googleOpeningHours?.weekdayDescriptions?.length ? (
                        <details className="mt-1">
                          <summary className="cursor-pointer list-none font-mono text-[0.6rem] font-bold uppercase tracking-wider text-amber hover:underline">
                            Opening hours
                          </summary>
                          <ul className="mt-1 space-y-0.5 font-body text-[0.72rem] leading-relaxed text-gray-mid">
                            {pub.googleOpeningHours.weekdayDescriptions.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Required Google attribution for Google-sourced content (photos, ratings, hours) */}
        <p className="mb-6 font-body text-[0.7rem] leading-relaxed text-gray-mid">
          Venue photos, ratings and opening hours via{' '}
          <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-amber">Google Maps</a>.
          Pint prices are reported and verified by Perth Pint Prices.
        </p>

        {/* Browse by day — internal links to the day pages */}
        <section className="mb-6 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="type-eyebrow">Planning ahead?</p>
              <h2 className="type-section leading-tight">Happy hours by day</h2>
            </div>
            <Link href="/articles/perth-happy-hours-by-day" className="font-mono text-[0.72rem] font-bold uppercase text-amber no-underline hover:underline">
              Read the guide →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
            {HAPPY_HOUR_DAYS.map(day => (
              <Link
                key={day.slug}
                href={`/happy-hour/${day.slug}`}
                className="rounded-card border border-gray-light bg-off-white px-3 py-3 text-center font-mono text-[0.72rem] font-bold uppercase text-ink no-underline hover:border-amber hover:text-amber"
              >
                {day.label.slice(0, 3)}
              </Link>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        {!loading && regionGroups.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill px-9 py-4 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
            >
              See Perth prices
            </Link>
          </div>
        )}

        {/* FAQ — answers the "what time / where cheapest / which pubs" PAA + FAQPage schema */}
        <section className="mt-10 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
          <h2 className="type-section leading-tight mb-4">Perth happy hour FAQ</h2>
          <div className="space-y-4">
            {faqItems.map(f => (
              <div key={f.q}>
                <h3 className="type-card leading-snug">{f.q}</h3>
                <p className="mt-1 font-body text-[0.85rem] leading-relaxed text-gray-mid">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }} />
      </div>

      <Footer />
    </div>
  )
}
