interface SocialProofProps {
  venueCount: number
  suburbCount: number
  avgPrice: string
}

export default function SocialProof({ venueCount, suburbCount, avgPrice }: SocialProofProps) {
  return (
    <section className="py-6 sm:py-8 bg-charcoal text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-amber text-sm font-semibold uppercase tracking-wider mb-1">Community-driven since 2024</p>
        <p className="text-stone-400 mb-5 text-sm max-w-md mx-auto">
          Every price on Arvo comes from someone who was actually there. No scraping, no guessing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-white mb-0.5">Weekly</div>
            <div className="text-stone-400 text-xs">Price checks</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-white mb-0.5">Zero</div>
            <div className="text-stone-400 text-xs">Estimated prices</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-white mb-0.5">100%</div>
            <div className="text-stone-400 text-xs">Verified data</div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-white mb-0.5">Free</div>
            <div className="text-stone-400 text-xs">No sign-up needed</div>
          </div>
        </div>
      </div>
    </section>
  )
}
