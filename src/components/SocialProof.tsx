interface SocialProofProps {
  venueCount: number
  suburbCount: number
  avgPrice: string
  cheapestPrice: number
  priciestPrice: number
  onSubmitClick?: () => void
}

export default function SocialProof({ venueCount, suburbCount, avgPrice, cheapestPrice, priciestPrice, onSubmitClick }: SocialProofProps) {

  return (
    <>
      {/* Stats section */}
      <section className="py-14 px-6">
        <div className="max-w-container mx-auto text-center">
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            {[
              { value: String(venueCount), label: 'Venues', accent: false },
              { value: String(suburbCount), label: 'Suburbs', accent: false },
              { value: cheapestPrice > 0 ? `$${cheapestPrice}` : 'TBC', label: 'Cheapest', accent: true },
              { value: priciestPrice > 0 ? `$${priciestPrice}` : 'TBC', label: 'Priciest', accent: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`border-3 border-ink rounded-card px-6 py-5 text-center min-w-[130px] shadow-hard ${
                  stat.accent ? 'bg-amber' : 'bg-white'
                }`}
              >
                <span className={`font-mono text-[2rem] font-extrabold tracking-[-0.02em] block leading-[1.1] ${
                  stat.accent ? 'text-white' : 'text-ink'
                }`}>
                  {stat.value}
                </span>
                <span className={`font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] block mt-0.5 ${
                  stat.accent ? 'text-white/75' : 'text-gray-mid'
                }`}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          <p className="font-display text-[1.1rem] italic text-gray-mid">
            Every price from a real person. No scraping. No guessing.
          </p>
        </div>
      </section>

      {/* Submit CTA */}
      <section className="bg-off-white py-14 px-6 text-center bg-noise relative">
        <div className="max-w-container mx-auto">
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
