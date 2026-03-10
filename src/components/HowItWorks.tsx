'use client'

import { Users, Clock, CheckCircle } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

const features = [
  {
    icon: Users,
    heading: 'Community-sourced',
    desc: 'Prices from submissions, menu checks, and direct calls. If we can\'t confirm it, you\'ll see "Price TBC".',
  },
  {
    icon: Clock,
    heading: 'Live happy hours',
    desc: 'Real-time tracking across Perth. See which pubs have cheap pints on right now.',
  },
  {
    icon: CheckCircle,
    heading: 'Always verified',
    desc: 'Every price shows when it was last checked. Stale data gets flagged so you know what\'s fresh.',
  },
]

export default function HowItWorks({ venueCount = 0, suburbCount = 0 }: HowItWorksProps) {
  const { ref, inView } = useInView()

  return (
    <section className="py-14 px-6">
      <div ref={ref} className={`max-w-container mx-auto reveal ${inView ? 'in-view' : ''}`}>
        {/* Section heading */}
        <p className="font-display text-[clamp(1.3rem,4vw,1.7rem)] italic text-ink leading-[1.3] text-center mb-2">
          Prices from real people.<br />
          If we can&apos;t confirm it, we say so.
        </p>
        <p className="font-body text-[0.9rem] text-gray-mid font-medium text-center mb-10">
          Community-sourced, regularly verified, always transparent.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.heading}
                className="border-3 border-ink rounded-card bg-off-white shadow-hard-sm p-5"
              >
                <Icon className="w-8 h-8 text-amber mb-3" strokeWidth={2} />
                <h3 className="font-mono text-[0.8rem] font-bold tracking-[0.02em] text-ink mb-2">
                  {feature.heading}
                </h3>
                <p className="font-body text-[0.85rem] text-gray-mid font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
