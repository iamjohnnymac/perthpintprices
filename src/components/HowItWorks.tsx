interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

export default function HowItWorks({ venueCount = 0, suburbCount = 0 }: HowItWorksProps) {
  return (
    <>
      {/* Size Legend */}
      <section className="bg-white py-14 px-6">
        <div className="max-w-container mx-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-amber" />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Beer Sizes</span>
          </div>
          <h2 className="font-mono font-extrabold text-[clamp(1.4rem,4vw,1.8rem)] tracking-[-0.03em] text-ink mb-6">
            Know your glass.
          </h2>
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { name: 'Middy', ml: '285ml' },
              { name: 'Schooner', ml: '425ml' },
              { name: 'Pint', ml: '570ml' },
            ].map((size) => (
              <div key={size.name} className="border-3 border-ink rounded-card px-6 py-5 text-center bg-white shadow-hard-sm flex-1 max-w-[180px]">
                <span className="font-mono text-[0.8rem] font-extrabold uppercase tracking-[0.05em] text-ink block">{size.name}</span>
                <span className="font-mono text-[0.7rem] text-gray-mid font-medium">{size.ml}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-6">
        <div className="max-w-container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { color: '#3B82F6', label: 'Track', heading: 'Real prices from real people.', desc: 'Community-submitted. No scraping. No guessing. Every price verified by someone who was actually there.' },
              { color: '#C43D2E', label: 'Happy Hours', heading: 'Never miss a deal.', desc: "Live happy hour tracking across Perth. Know exactly where the cheap pints are flowing right now." },
              { color: '#2D7A3D', label: 'Fresh', heading: 'Always up to date.', desc: 'Prices updated weekly. Stale data gets flagged. The freshest prices float to the top.' },
            ].map((feature) => (
              <div key={feature.label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3.5 h-3.5 rounded-[4px]" style={{ background: feature.color }} />
                  <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">{feature.label}</span>
                </div>
                <h3 className="font-mono text-base font-extrabold tracking-[-0.02em] text-ink leading-[1.2] mb-2">{feature.heading}</h3>
                <p className="font-body text-[0.85rem] text-gray-mid font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
