export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Find pubs near you',
      desc: 'Browse 200+ pubs across 90 Perth suburbs with real-time prices and happy hour info.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Compare prices',
      desc: 'See how every pub stacks up against the Perth average. Track happy hours and price changes.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Go enjoy your pint',
      desc: 'Get directions, check the vibe, and save money on your next round. Simple as.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      ),
    },
  ]

  return (
    <section className="py-20 sm:py-24 border-t border-stone-200/60">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-title text-charcoal font-heading text-center mb-4">
          How it works
        </h2>
        <p className="text-stone-500 text-center mb-12 text-lg">No app download. No sign-up. Just prices.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber/10 text-amber mb-5">
                {step.icon}
              </div>
              <div className="text-sm font-mono text-amber font-bold mb-2">{step.num}</div>
              <h3 className="text-xl font-semibold text-charcoal mb-2 font-heading">{step.title}</h3>
              <p className="text-stone-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
