'use client'

import { useInView } from '@/hooks/useInView'

interface SocialProofProps {
  venueCount: number
  suburbCount: number
  avgPrice: string
  cheapestPrice: number
  priciestPrice: number
  onSubmitClick?: () => void
}

export default function SocialProof({ avgPrice, onSubmitClick }: SocialProofProps) {
  const { ref: trustRef, inView: trustInView } = useInView()
  const { ref: ctaRef, inView: ctaInView } = useInView()

  return (
    <>
      {/* Trust signal + avg price */}
      <section className="py-14 px-6">
        <div ref={trustRef} className={`max-w-container mx-auto text-center reveal ${trustInView ? 'in-view' : ''}`}>
          <p className="font-display text-[clamp(1.3rem,4vw,1.7rem)] italic text-ink leading-[1.3] mb-4">
            Prices from real people.<br />
            If we can&apos;t confirm it, we say so.
          </p>
          <div className="inline-flex items-baseline gap-2 border-3 border-ink rounded-pill px-7 py-3 bg-white shadow-hard-sm">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Avg pint</span>
            <span className="font-mono text-[1.4rem] font-extrabold tracking-[-0.02em] text-ink">${avgPrice}</span>
          </div>
        </div>
      </section>

      {/* Submit CTA */}
      <section className="bg-off-white py-14 px-6 text-center bg-noise relative">
        <div ref={ctaRef} className={`max-w-container mx-auto reveal ${ctaInView ? 'in-view' : ''}`}>
          <h2 className="text-[clamp(1.5rem,4vw,2rem)] text-ink mb-2">
            Know a price we&apos;re missing?
          </h2>
          <p className="font-body text-[0.95rem] text-gray-mid font-medium mb-6">
            Help the community. Takes 30 seconds.
          </p>
          <button
            onClick={onSubmitClick}
            className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
          >
            Submit a Price →
          </button>
        </div>
      </section>
    </>
  )
}
