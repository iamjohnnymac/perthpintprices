interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

export default function HowItWorks({ venueCount = 200, suburbCount = 90 }: HowItWorksProps) {
  const steps = [
    { num: '01', title: 'Find your pub', desc: `Search or browse ${venueCount}+ venues across ${suburbCount} Perth suburbs.` },
    { num: '02', title: 'Compare prices', desc: "See who's cheapest, who's on happy hour, and what's nearby." },
    { num: '03', title: 'Go enjoy', desc: 'Get directions, grab a pint, save a few bucks.' },
  ]

  return (
    <section className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-1">
          How it works
        </h2>
        <p className="text-stone-warm mb-4 text-base">No app download. No sign-up. Just prices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber/10 text-amber font-mono font-bold text-sm mb-3">
                {step.num}
              </div>
              <h3 className="font-serif text-lg text-charcoal mb-1">{step.title}</h3>
              <p className="text-stone-warm leading-relaxed text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
