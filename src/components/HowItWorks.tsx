interface HowItWorksProps {
  venueCount?: number
  suburbCount?: number
}

function SearchIcon() {
  return (
    <svg className="w-7 h-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg className="w-7 h-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function PintIcon() {
  return (
    <svg className="w-7 h-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

export default function HowItWorks({ venueCount = 420, suburbCount = 154 }: HowItWorksProps) {
  const steps = [
    { num: '01', title: 'Find your pub', desc: `Search or browse ${venueCount}+ venues across ${suburbCount} Perth suburbs.`, Icon: SearchIcon },
    { num: '02', title: 'Compare prices', desc: "See who's cheapest, who's on happy hour, and what's nearby.", Icon: CompareIcon },
    { num: '03', title: 'Go enjoy', desc: 'Get directions, grab a pint, save a few bucks.', Icon: PintIcon },
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
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-amber/10">
                <step.Icon />
              </div>
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
