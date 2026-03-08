'use client'

import { useInView } from '@/hooks/useInView'

interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

export default function HowItWorks({ venueCount = 0, suburbCount = 0 }: HowItWorksProps) {
  const { ref: sizesRef, inView: sizesInView } = useInView()
  const { ref: featuresRef, inView: featuresInView } = useInView()

  return (
    <>
      {/* Size Legend */}
      <section className="bg-off-white py-14 px-6 bg-noise relative">
        <div ref={sizesRef} className={`max-w-container mx-auto reveal ${sizesInView ? 'in-view' : ''}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-blue" />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Beer Sizes</span>
          </div>
          <h2 className="text-[clamp(1.4rem,4vw,1.8rem)] tracking-[-0.03em] text-ink mb-6">
            Know your glass.
          </h2>
          <div className="flex justify-center items-end gap-6 flex-wrap">
            {[
              { name: 'Middy', ml: '285ml', glassH: 48, glassW: 32, foamH: 14, handleH: 22, handleW: 10 },
              { name: 'Schooner', ml: '425ml', glassH: 68, glassW: 38, foamH: 16, handleH: 28, handleW: 12 },
              { name: 'Pint', ml: '570ml', glassH: 90, glassW: 44, foamH: 18, handleH: 34, handleW: 14 },
            ].map((size) => (
              <div key={size.name} className="border-3 border-ink rounded-card px-6 py-5 text-center bg-white shadow-hard-sm flex-1 max-w-[180px] flex flex-col items-center">
                {/* Mini beer glass illustration */}
                <div className="mb-3 relative" style={{ width: size.glassW + size.handleW + 8, height: size.glassH + 10 }}>
                  <div
                    className="relative border-[2.5px] border-ink overflow-hidden mx-auto"
                    style={{
                      width: size.glassW,
                      height: size.glassH,
                      borderRadius: '3px 3px 6px 6px',
                      background: 'linear-gradient(180deg, #F5D98A 0%, #D4A030 45%, #C4880A 100%)',
                    }}
                  >
                    {/* Foam */}
                    <div
                      className="absolute -left-[2px] -right-[2px] bg-[#FFFEF0] border-[2.5px] border-ink border-b-0"
                      style={{
                        top: -6,
                        height: size.foamH,
                        borderRadius: '10px 10px 40% 40%',
                      }}
                    />
                    {/* Handle */}
                    <div
                      className="absolute border-[2.5px] border-ink border-l-0 bg-white"
                      style={{
                        right: -(size.handleW + 6),
                        top: size.glassH * 0.2,
                        width: size.handleW,
                        height: size.handleH,
                        borderRadius: `0 ${size.handleW * 0.7}px ${size.handleW * 0.7}px 0`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[0.8rem] font-extrabold uppercase tracking-[0.05em] text-ink block">{size.name}</span>
                <span className="font-mono text-[0.7rem] text-gray-mid font-medium">{size.ml}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
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
    </>
  )
}
