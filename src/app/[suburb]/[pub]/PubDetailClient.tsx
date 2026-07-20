'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Pub } from '@/types/pub'
import WatchlistButton from '@/components/WatchlistButton'
import PriceHistory from '@/components/PriceHistory'
import GoodToKnow from '@/components/GoodToKnow'
import SubmitPubForm from '@/components/SubmitPubForm'
import { formatHappyHourDays } from '@/lib/happyHourLive'
import Footer from '@/components/Footer'
import { pubUrl, suburbUrl } from '@/lib/urls'
import { resizeGooglePhoto } from '@/lib/pubPhoto'
import {
  cheaperNearby,
  faqHappyHourAnswer,
  faqNearbyAnswer,
  faqPriceAnswer,
  faqQuestion,
  verificationStub,
} from '@/lib/voiceCopy'
import { formatDistance } from '@/lib/location'
import { describePriceSource } from '@/lib/priceProvenance'
import { trackSiteEvent } from '@/lib/analytics'
import type { PriceRecencyInfo } from '@/lib/freshness'
import PintReceipt, { type PintReceiptData } from '@/components/PintReceipt'

const PubDetailMap = dynamic(() => import('@/components/PubDetailMap'), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-off-white animate-pulse rounded-card border-3 border-ink" />,
})

function formatLastVerifiedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatHappyHourTime(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const fmt = (t: string) => {
    const h = parseInt(t.split(':')[0])
    const period = h >= 12 ? 'pm' : 'am'
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${h12}${period}`
  }
  return `${fmt(start)} - ${fmt(end)}`
}

function formatReadableHappyHourDays(days: string | null): string | null {
  if (!days) return null
  return formatHappyHourDays(days).replace(/,\s*/g, ', ')
}

function formatHappyHourVoiceTime(value: string | null): string | null {
  if (!value) return null
  const [hourValue, minuteValue = '0'] = value.split(':')
  const hour = Number(hourValue)
  const minute = Number(minuteValue)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return minute > 0 ? `${hour12}:${String(minute).padStart(2, '0')}${period}` : `${hour12}${period}`
}

type PubFaq = {
  question: string
  answer: string
}

interface PubDetailClientProps {
  pub: Pub
  priceRecency: PriceRecencyInfo
  nearbyPubs: Pub[]
  avgPrice: number
  suburbAvgPrice: number | null
  isTierCPage: boolean
  latestAndrewCallAt: string | null
  nearestVerifiedPub: Pub | null
  nearbyVerifiedPriceCount: number
}

export default function PubDetailClient({
  pub,
  priceRecency,
  nearbyPubs,
  avgPrice,
  suburbAvgPrice,
  isTierCPage,
  latestAndrewCallAt,
  nearestVerifiedPub,
  nearbyVerifiedPriceCount,
}: PubDetailClientProps) {
  const [distance, setDistance] = useState<string | null>(null)
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const R = 6371
        const dLat = (pub.lat - pos.coords.latitude) * Math.PI / 180
        const dLng = (pub.lng - pos.coords.longitude) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pos.coords.latitude * Math.PI / 180) * Math.cos(pub.lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        if (d > 500) return // Too far to be meaningful (likely not in Perth)
        setDistance(d < 1 ? `${Math.round(d * 1000)}m away` : `${d.toFixed(1)}km away`)
      }, () => {})
    }
  }, [pub.lat, pub.lng])

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`

  async function sharePub() {
    const text = `$${pub.price?.toFixed(2) ?? 'TBC'} pints at ${pub.name}, ${pub.suburb} - found on Perth Pint Prices`
    if (navigator.share) {
      try { await navigator.share({ text, url: window.location.href }) } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    }
  }

  const priceDiff = pub.effectivePrice && avgPrice ? pub.effectivePrice - avgPrice : 0
  const currentPrice = pub.effectivePrice ?? pub.price
  const standardPrice = pub.regularPrice ?? pub.price
  const hasCheaperNearby = currentPrice !== null && nearbyPubs.some(nearby =>
    nearby.price !== null && nearby.price < currentPrice
  )
  const priceSourcePhrase = describePriceSource(pub.priceSource)
  const priceVerifiedAt = pub.priceVerifiedAt || pub.lastVerified
  const priceProvenance = pub.price !== null && priceSourcePhrase && priceVerifiedAt
    ? {
      sourcePhrase: priceSourcePhrase,
      verifiedAt: priceVerifiedAt,
      verifiedDate: formatLastVerifiedDate(priceVerifiedAt),
    }
    : null
  const confidenceLabel = pub.priceConfidence === 'low' ? 'Low confidence' : null
  const priceMissingCopy = isTierCPage
    ? verificationStub({
      lastAndrewCall: latestAndrewCallAt ? formatLastVerifiedDate(latestAndrewCallAt) : null,
      nearbyCount: nearbyVerifiedPriceCount,
      nearestPub: nearestVerifiedPub?.name ?? null,
      nearestPrice: nearestVerifiedPub?.price ?? null,
    })
    : null
  const checkedDate = priceVerifiedAt ? formatLastVerifiedDate(priceVerifiedAt) : null
  // Answer-first line (SEO/AEO) — directly answers "how much is a pint at X".
  const hhWindowText = pub.happyHourDays && pub.happyHourStart && pub.happyHourEnd
    ? `${formatReadableHappyHourDays(pub.happyHourDays)} ${formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd)}`
    : null
  const answerLine = pub.regularPrice != null
    ? `A pint at ${pub.name} is $${pub.regularPrice.toFixed(2)}${checkedDate ? `, last checked ${checkedDate}` : ''}.`
    : pub.happyHourPrice != null
      ? `${pub.name} pours a $${pub.happyHourPrice.toFixed(2)} pint during happy hour${hhWindowText ? ` (${hhWindowText})` : ''}. Standard price not confirmed yet.`
      : null
  const happyHourDaysText = formatReadableHappyHourDays(pub.happyHourDays)
  const happyHourStartText = formatHappyHourVoiceTime(pub.happyHourStart)
  const happyHourEndText = formatHappyHourVoiceTime(pub.happyHourEnd)
  const cheaperNearbyList = currentPrice === null
    ? []
    : nearbyPubs
      .filter(nearby => nearby.price !== null && nearby.price < currentPrice)
      .map(nearby => ({
        name: nearby.name,
        price: nearby.price as number,
        distance: nearby.distanceKm !== null && nearby.distanceKm !== undefined
          ? formatDistance(nearby.distanceKm)
          : nearby.suburb,
      }))
  const nearbySummary = nearbyPubs.length > 0 && currentPrice !== null
    ? cheaperNearby(pub.name, cheaperNearbyList, '2km')
    : null
  const nearestCheaper = currentPrice === null
    ? null
    : nearbyPubs.find(nearby => nearby.price !== null && nearby.price < currentPrice)

  // PROTOTYPE — flat data bundle for the receipt-card variants.
  const receiptAmenities: string[] = []
  if (pub.outdoorSeating) receiptAmenities.push('Beer garden')
  if (pub.goodForWatchingSports) receiptAmenities.push('Shows the footy')
  if (pub.goodForChildren) receiptAmenities.push('Kids welcome')
  if (pub.allowsDogs) receiptAmenities.push('Dog-friendly')
  if (pub.liveMusic) receiptAmenities.push('Live music')
  if (pub.servesFood) receiptAmenities.push('Kitchen')
  const receiptData: PintReceiptData = {
    name: pub.name,
    suburb: pub.suburb,
    beerType: pub.beerType,
    price: pub.price,
    regularPrice: pub.regularPrice,
    isHappyHourNow: pub.isHappyHourNow,
    avgPrice,
    priceDiff,
    happyHour: (pub.happyHour || pub.happyHourPrice)
      ? { days: formatReadableHappyHourDays(pub.happyHourDays), time: formatHappyHourTime(pub.happyHourStart, pub.happyHourEnd), price: pub.happyHourPrice }
      : null,
    checkedDate,
    sourcePhrase: priceProvenance?.sourcePhrase ?? null,
    confidenceLabel,
    recencyLabel: priceRecency.label,
    recencyTier: priceRecency.tier,
    cheaperNearby: nearestCheaper && nearestCheaper.price !== null
      ? { name: nearestCheaper.name, price: nearestCheaper.price, distance: nearestCheaper.distanceKm != null ? formatDistance(nearestCheaper.distanceKm) : nearestCheaper.suburb }
      : null,
    googleRating: pub.googleRating ?? null,
    googleRatingCount: pub.googleRatingCount ?? null,
    amenities: receiptAmenities,
    editorialSummary: pub.googleEditorialSummary ?? null,
  }

  const faqItems: PubFaq[] = [
    {
      question: faqQuestion('price', String(pub.id), pub.name),
      answer: faqPriceAnswer({
        pub: pub.name,
        suburb: pub.suburb,
        price: standardPrice,
        suburbAvg: suburbAvgPrice,
        checkedDate,
      }),
    },
    {
      question: faqQuestion('happyHour', String(pub.id), pub.name),
      answer: faqHappyHourAnswer({
        pub: pub.name,
        days: happyHourDaysText,
        start: happyHourStartText,
        end: happyHourEndText,
        hhPrice: pub.happyHourPrice,
      }),
    },
    {
      question: faqQuestion('nearby', String(pub.id), pub.name),
      answer: faqNearbyAnswer(
        nearestCheaper && currentPrice !== null && nearestCheaper.price !== null
          ? {
            cheaperPub: nearestCheaper.name,
            distance: nearestCheaper.distanceKm !== null && nearestCheaper.distanceKm !== undefined
              ? formatDistance(nearestCheaper.distanceKm)
              : nearestCheaper.suburb,
            price: nearestCheaper.price,
            delta: currentPrice - nearestCheaper.price,
          }
          : null,
      ),
    },
  ].filter((item): item is PubFaq => Boolean(item.answer))
  const showFaq = faqItems.length >= 2
  const faqPageJsonLd = showFaq
    ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    }
    : null
  const trackingTier = isTierCPage ? 'tier_c' : 'priced'

  function openReportForm(source: string) {
    trackSiteEvent('report_price_click', {
      source,
      pub_slug: pub.slug,
      suburb: pub.suburb,
      page_tier: trackingTier,
    })
    setShowSubmitForm(true)
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      {/* Navigation */}
      <header className="max-w-container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center text-sm shadow-[2px_2px_0_#171717]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span className="font-mono text-[0.95rem] sm:text-[1.05rem] font-extrabold text-ink tracking-[-0.04em] leading-none">Perth Pint Prices</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <WatchlistButton slug={pub.slug} name={pub.name} suburb={pub.suburb} size="md" />
          <button onClick={sharePub} className="text-gray-mid hover:text-amber transition-colors p-2" title="Share this pub">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-container mx-auto px-6 pb-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-mono text-[0.7rem] text-gray-mid">
          <Link href="/" className="hover:text-amber transition-colors no-underline">Home</Link>
          <span>/</span>
          <Link href={suburbUrl(pub.suburb)} className="hover:text-amber transition-colors no-underline">{pub.suburb}</Link>
          <span>/</span>
          <span className="text-ink font-bold">{pub.name}</span>
        </nav>

        {/* Name + vibe + answer-first line */}
        <div>
          <h1 className="type-hero">
            {pub.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[0.8rem] text-gray-mid">
            <span>{pub.suburb}{distance && ` · ${distance}`}</span>
            {pub.vibeTag && (
              <span className="font-mono text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-gray-light text-gray-mid">{pub.vibeTag}</span>
            )}
          </div>
          {pub.address && (
            <p className="mt-1 font-body text-[0.78rem] text-gray-mid">{pub.address}</p>
          )}
          {answerLine && (
            <p className="mt-3 max-w-[42rem] font-body text-[0.95rem] leading-relaxed text-ink">{answerLine}</p>
          )}
        </div>

        {/* Venue photo — Google Places (attributed), falling back to a manually-supplied shot */}
        {(pub.googlePhotoUrl || pub.imageUrl) && (
          <figure>
            {/* Plain img on purpose: Google photos must be hotlinked + refreshed, not re-hosted/optimised on our CDN. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resizeGooglePhoto(pub.googlePhotoUrl || pub.imageUrl)!}
              alt={`${pub.name}, ${pub.suburb}`}
              loading="lazy"
              className="h-56 w-full rounded-card border-3 border-ink object-cover shadow-hard-sm sm:h-72"
            />
            <figcaption className="mt-1 text-right font-body text-[0.62rem] text-gray-mid">
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

        {/* Permanently closed notice — Places business_status */}
        {pub.businessStatus === 'CLOSED_PERMANENTLY' && (
          <div className="border-3 border-ink rounded-card bg-red-pale p-4 shadow-hard-sm">
            <p className="font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.05em] text-red">Permanently closed</p>
            <p className="mt-1 font-body text-[0.85rem] leading-relaxed text-ink">
              Google lists {pub.name} as permanently closed.{' '}
              <Link href={suburbUrl(pub.suburb)} className="font-bold text-red no-underline hover:underline">
                See other {pub.suburb} pubs →
              </Link>
            </p>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-8">
            {/* Pint price card — the receipt (every pub) */}
            <PintReceipt data={receiptData} onReport={() => openReportForm('pub_page_cta')} />

            {/* Missing-price stub — point unpriced pubs at the nearest checked price */}
            {priceMissingCopy && (
              <div className="border-3 border-ink rounded-card bg-white shadow-hard-sm px-5 py-4">
                {nearestVerifiedPub ? (
                  <Link
                    href={pubUrl({ suburb: nearestVerifiedPub.suburb, slug: nearestVerifiedPub.slug })}
                    onClick={() => trackSiteEvent('pub_nearby_click', {
                      source: 'pub_missing_price_stub',
                      pub_slug: pub.slug,
                      suburb: pub.suburb,
                      target_slug: nearestVerifiedPub.slug,
                      target_suburb: nearestVerifiedPub.suburb,
                      page_tier: trackingTier,
                    })}
                    className="block text-[0.86rem] leading-relaxed text-ink hover:text-amber transition-colors no-underline"
                  >
                    {priceMissingCopy}
                  </Link>
                ) : (
                  <p className="text-[0.86rem] leading-relaxed text-ink">{priceMissingCopy}</p>
                )}
              </div>
            )}

            {/* About this pub — bordered card so the prose sits in the page rhythm.
                Good-to-know is summary-only; the receipt carries rating + amenities. */}
            {(pub.description || pub.googleEditorialSummary) && (
              <section className="border-3 border-ink rounded-card bg-white shadow-hard-sm p-5 space-y-4">
                {pub.description && (
                  <div>
                    <p className="type-eyebrow mb-2">About</p>
                    <p className="text-[0.85rem] text-gray-mid leading-relaxed">{pub.description}</p>
                  </div>
                )}
                <GoodToKnow pub={pub} summaryOnly />
              </section>
            )}

            {/* Opening hours — sourced from Google, shown structured (the ranking listicles don't) */}
            {pub.googleOpeningHours?.weekdayDescriptions?.length ? (
              <section className="border-3 border-ink rounded-card bg-white shadow-hard-sm p-5">
                <p className="type-eyebrow mb-3">Opening hours</p>
                <ul className="space-y-1.5">
                  {pub.googleOpeningHours.weekdayDescriptions.map((line, i) => {
                    const [day, ...rest] = line.split(': ')
                    const hours = rest.join(': ')
                    return (
                      <li key={i} className="flex justify-between gap-4 font-mono text-[0.76rem]">
                        <span className="text-gray-mid">{day}</span>
                        <span className="text-right text-ink">{hours || '—'}</span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-3 font-mono text-[0.58rem] text-gray-mid">Hours via Google Maps</p>
              </section>
            ) : null}

            {/* Price History */}
            <PriceHistory pubId={pub.id} currentPrice={pub.price} />

            {/* Action buttons */}
            <div className="flex gap-3">
              {pub.website && (
                <a
                  href={pub.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSiteEvent('pub_external_click', {
                    action: 'website',
                    pub_slug: pub.slug,
                    suburb: pub.suburb,
                    page_tier: trackingTier,
                  })}
                  className="flex-1 font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all text-center no-underline"
                >
                  Visit Website
                </a>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSiteEvent('pub_external_click', {
                  action: 'directions',
                  pub_slug: pub.slug,
                  suburb: pub.suburb,
                  page_tier: trackingTier,
                })}
                className="flex-1 font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-white bg-ink border-3 border-ink rounded-pill py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all text-center no-underline"
              >
                Get Directions
              </a>
            </div>

          </div>

          {/* Right column - map */}
          <div className="md:sticky md:top-20 rounded-card overflow-hidden h-[350px] border-3 border-ink shadow-hard-sm">
            <PubDetailMap lat={pub.lat} lng={pub.lng} name={pub.name} price={pub.price} />
          </div>
        </div>

        {/* Nearby Pubs */}
        {nearbyPubs.length > 0 && (
          <section className="mt-8 border-3 border-ink rounded-card bg-white shadow-hard-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-light flex items-center justify-between">
              <div>
                <h2 className="type-card-header">
                  {hasCheaperNearby ? 'Cheaper nearby' : 'Nearby verified prices'}
                </h2>
                {nearbySummary && <p className="mt-1 text-[0.72rem] leading-snug text-gray-mid">{nearbySummary}</p>}
              </div>
              <Link
                href={suburbUrl(pub.suburb)}
                onClick={() => trackSiteEvent('pub_internal_click', {
                  source: 'pub_nearby_header',
                  pub_slug: pub.slug,
                  suburb: pub.suburb,
                  target_path: suburbUrl(pub.suburb),
                })}
                className="font-mono text-[0.7rem] font-bold text-amber hover:underline no-underline whitespace-nowrap"
              >
                View suburb →
              </Link>
            </div>
            {nearbyPubs.map((nearby, i) => {
              const distanceText = nearby.distanceKm !== null && nearby.distanceKm !== undefined
                ? `${formatDistance(nearby.distanceKm)} away`
                : null
              const priceText = nearby.price !== null ? `$${nearby.price.toFixed(2)}` : 'TBC'
              const priceDelta = currentPrice !== null && nearby.price !== null
                ? currentPrice - nearby.price
                : null

              return (
                <Link
                  key={nearby.id}
                  href={pubUrl({ suburb: nearby.suburb, slug: nearby.slug })}
                  aria-label={`${nearby.name} in ${nearby.suburb}: ${priceText} pints${distanceText ? `, ${distanceText}` : ''}`}
                  onClick={() => trackSiteEvent('pub_nearby_click', {
                    source: 'pub_nearby_list',
                    pub_slug: pub.slug,
                    suburb: pub.suburb,
                    target_slug: nearby.slug,
                    target_suburb: nearby.suburb,
                    target_price: nearby.price,
                    cheaper: priceDelta !== null && priceDelta > 0,
                    page_tier: trackingTier,
                    position: i + 1,
                  })}
                  className={`flex items-center justify-between px-4 py-3 no-underline group hover:bg-off-white transition-colors ${
                    i < nearbyPubs.length - 1 ? 'border-b border-gray-light' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.82rem] font-extrabold text-ink group-hover:text-amber transition-colors truncate">{nearby.name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                      <span className="text-[0.65rem] text-gray-mid">{nearby.suburb}</span>
                      {distanceText && <span className="text-[0.65rem] text-gray-mid">{distanceText}</span>}
                      {nearby.beerType && <span className="text-[0.65rem] text-gray-mid">{nearby.beerType}</span>}
                      {priceDelta !== null && priceDelta > 0 && (
                        <span className="text-[0.65rem] font-bold text-green">${priceDelta.toFixed(2)} cheaper</span>
                      )}
                      {nearby.isHappyHourNow && (
                        <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-red">
                          <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                          Happy Hour
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[1rem] font-extrabold text-ink ml-3 flex-shrink-0">
                    {priceText}
                  </span>
                </Link>
              )
            })}
          </section>
        )}

        {showFaq && faqPageJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd).replace(/</g, '\\u003c') }}
          />
        )}
        {showFaq && (
          <section className="border-3 border-ink rounded-card bg-white p-5 shadow-hard-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="type-card-header">
                {pub.name} pint FAQ
              </h2>
              <span className="font-mono text-[0.65rem] font-bold text-amber">{faqItems.length} answers</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {faqItems.map(item => (
                <div key={item.question} className="rounded-card border border-gray-light bg-off-white p-4">
                  <h3 className="type-card leading-snug">{item.question}</h3>
                  <p className="mt-2 font-body text-[0.78rem] leading-relaxed text-gray-mid">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
      <SubmitPubForm
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        initialPub={{ slug: pub.slug, name: pub.name, suburb: pub.suburb }}
        submissionSource={isTierCPage ? 'tier-c-report-hero' : undefined}
      />
    </div>
  )
}
