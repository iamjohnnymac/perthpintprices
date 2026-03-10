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

export default function SocialProof({ avgPrice, venueCount, onSubmitClick }: SocialProofProps) {
  const { ref, inView } = useInView()

  return (
    <section className="bg-off-white py-14 px-6 text-center bg-noise relative">
      <div ref={ref} className={`max-w-container mx-auto reveal ${inView ? 'in-view' : ''}`}>
        {/* Stat + context */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="inline-flex items-baseline gap-2 border-3 border-ink rounded-pill px-7 py-3 bg-white shadow-hard-sm">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Avg pint</span>
            <span className="font-mono text-[1.4rem] font-extrabold tracking-[-0.02em] text-ink">${avgPrice}</span>
          </div>
          <span className="font-mono text-[0.7rem] text-gray-mid tracking-[0.02em]">
            across {venueCount} Perth venues
          </span>
        </div>

        {/* CTA */}
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
  )
}
