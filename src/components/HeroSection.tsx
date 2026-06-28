import Link from 'next/link'
import { pubUrl } from '@/lib/urls'

interface HeroSectionProps {
  pubs: { price: number | null; suburb: string; slug: string }[]
}

export default function HeroSection({ pubs }: HeroSectionProps) {
  const priced = pubs.filter(p => p.price !== null)
  const venueCount = pubs.length
  const suburbCount = new Set(pubs.map(p => p.suburb)).size
  const cheapestPub = priced.length > 0 ? priced.reduce((a, b) => a.price! <= b.price! ? a : b) : null
  const cheapest = cheapestPub?.price ?? 0

  return (
    <>
      {/* Hero */}
      <section className="text-center px-6 pt-0 sm:pt-2 pb-8 max-w-container mx-auto relative">
        {/* Dot grid background texture */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.035] pointer-events-none" />

        {/* Draught beer animation (adapted from codepen.io/comehope/pen/rZeOQp) */}
        <div className="mx-auto -mt-4 sm:mt-0 mb-6 animate-fade-in draught-viewport" aria-hidden>
          <div className="draught-scene">
            <div className="draught-keg">
              <span className="draught-handle"></span>
              <span className="draught-pipe"></span>
            </div>
            <div className="draught-glass">
              <span className="draught-beer"></span>
            </div>
          </div>
        </div>

        <h1 className="type-hero-editorial mb-3 animate-fade-up stagger-2">
          Perth&apos;s pints,<br />
          <span className="text-amber italic">sorted.</span>
        </h1>
        <p className="font-body text-[1rem] text-gray-mid font-medium animate-fade-up stagger-3">
          What a pint actually costs, across {venueCount} Perth pubs.
        </p>
        <p className="type-eyebrow text-gray-mid/60 mt-2 animate-fade-up stagger-4">
          Community-powered · Est. 2026
        </p>
      </section>

      {/* Stat strip */}
      <div className="max-w-container mx-auto px-6 pb-8 flex gap-2.5 justify-center flex-wrap">
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-white shadow-hard-sm animate-fade-up stagger-5">
          <span className="type-price text-[1.6rem] block leading-[1.1]">{venueCount}</span>
          <span className="type-eyebrow block mt-0.5">Venues</span>
        </div>
        <Link href="/suburbs" className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-white shadow-hard-sm animate-fade-up stagger-6 hover:translate-y-[-2px] transition-transform">
          <span className="type-price text-[1.6rem] block leading-[1.1]">{suburbCount}</span>
          <span className="type-eyebrow block mt-0.5">Suburbs</span>
        </Link>
        {cheapestPub ? (
          <Link href={pubUrl(cheapestPub)} className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-amber shadow-hard-sm animate-fade-up stagger-7 hover:translate-y-[-2px] transition-transform">
            <span className="type-price text-[1.6rem] block leading-[1.1] text-white">${cheapest}</span>
            <span className="type-eyebrow block mt-0.5 text-ink">Cheapest</span>
          </Link>
        ) : (
          <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-amber shadow-hard-sm animate-fade-up stagger-7">
            <span className="type-price text-[1.6rem] block leading-[1.1] text-white">TBC</span>
            <span className="type-eyebrow block mt-0.5 text-ink">Cheapest</span>
          </div>
        )}
      </div>
    </>
  )
}
