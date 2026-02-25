interface SocialProofProps {
  venueCount: number
  suburbCount: number
  avgPrice: string
}

export default function SocialProof({ venueCount, suburbCount, avgPrice }: SocialProofProps) {
  const proofs = [
    { value: `${venueCount}+`, label: 'Venues tracked' },
    { value: String(suburbCount), label: 'Perth suburbs' },
    { value: `$${avgPrice}`, label: 'Perth average pint' },
    { value: '100%', label: 'Verified prices' },
  ]
  return (
    <section className="py-16 sm:py-20 bg-charcoal text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-amber text-sm font-semibold uppercase tracking-wider mb-2">Community-driven since 2024</p>
        <p className="text-stone-400 mb-12 text-lg">Every price on Arvo comes from someone who was actually there.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {proofs.map((p) => (
            <div key={p.label}>
              <div className="font-serif text-3xl sm:text-4xl text-white mb-1">{p.value}</div>
              <div className="text-stone-400 text-sm">{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
