'use client'

import { useInView } from '@/hooks/useInView'

interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

export default function HowItWorks({ venueCount = 0, suburbCount = 0 }: HowItWorksProps) {
  const { ref: featuresRef, inView: featuresInView } = useInView()

  return (
    <section className="py-14 px-6">
      <div ref={featuresRef} className={`max-w-container mx-auto reveal ${featuresInView ? 'in-view' : ''}`}>
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
              <h3 className="text-base font-bold tracking-[-0.02em] text-ink leading-[1.2] mb-2">{feature.heading}</h3>
              <p className="font-body text-[0.85rem] text-gray-mid font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
