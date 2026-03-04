interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

export default function HowItWorks({ venueCount = 200, suburbCount = 90 }: HowItWorksProps) {
  const steps = [
    { num: '01', title: 'Find your pub', desc: 'Search or browse ' + venueCount + '+ venues across ' + suburbCount + ' Perth suburbs.', icon: '🔍' },
    { num: '02', title: 'Compare prices', desc: "See who's cheapest, who's on happy hour, and what's nearby.", icon: '💰' },
    { num: '03', title: 'Go enjoy', desc: 'Get directions, grab a pint, save a few bucks.', icon: '🍺' },
  ]

  return (
    <section className="py-12 sm:py-16 bg-cream/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-charcoal mb-2">
          How it works
        </h2>
        <p className="text-stone-400 mb-8 text-sm">No app download. No sign-up. Just prices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-xl p-5 text-center shadow-sm border border-stone-100">
              <div className="text-2xl mb-3">{step.icon}</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber/10 text-amber font-mono font-bold text-xs mb-2">
                {step.num}
              </div>
              <h3 className="font-serif text-lg text-charcoal mb-1">{step.title}</h3>
              <p className="text-stone-400 leading-relaxed text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
