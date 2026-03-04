interface SocialProofProps {
  venueCount: number
  suburbCount: number
  avgPrice: string
}

export default function SocialProof({ venueCount, suburbCount, avgPrice }: SocialProofProps) {
  const stats = [
    { value: 'Weekly', label: 'Price checks' },
    { value: 'Zero', label: 'Estimated prices' },
    { value: '100%', label: 'Verified data' },
    { value: 'Free', label: 'No sign-up needed' },
  ]

  return (
    <section className="py-12 sm:py-16 bg-charcoal text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-amber text-xs font-semibold uppercase tracking-wider mb-2">Community-driven since 2024</p>
        <p className="text-stone-400 mb-8 text-sm max-w-md mx-auto leading-relaxed">
          Every price on Arvo comes from someone who was actually there. No scraping, no guessing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="font-serif text-3xl sm:text-4xl text-white mb-1">{stat.value}</div>
              <div className="text-stone-500 text-xs uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
