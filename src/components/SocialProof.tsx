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
    <section className="py-16 sm:py-20 border-t border-stone-200/60 bg-cream-dark">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {proofs.map((p) => (
            <div key={p.label}>
              <div className="text-3xl sm:text-4xl font-bold text-charcoal font-heading">{p.value}</div>
              <div className="text-stone-500 text-sm mt-1">{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
