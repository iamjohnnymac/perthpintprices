'use client'
import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = [
    {
      q: 'How are prices verified?',
      a: 'Every price on PintDex is manually verified through pub menus, direct calls, and community submissions. We never estimate or guess — if we don\'t have a verified price, we show "Price TBC" until we confirm it.',
    },
    {
      q: 'How often is the data updated?',
      a: 'We run automated checks weekly and accept community submissions around the clock. Every price includes a "last verified" date so you know how fresh it is.',
    },
    {
      q: 'What does the price represent?',
      a: 'All prices shown are for a standard pint (570ml) of the cheapest tap beer available at each venue. Happy hour prices are shown when they\'re currently active.',
    },
    {
      q: 'How can I submit a price?',
      a: 'Tap the "Submit a Price" button at the top of the page. Tell us the pub name, suburb, and the pint price you paid. We\'ll verify and add it to the database.',
    },
    {
      q: 'Why is a pub showing "Price TBC"?',
      a: 'We only display prices we\'ve confirmed. "Price TBC" means we know the pub exists but haven\'t verified its current pint price yet. You can help by submitting it!',
    },
    {
      q: 'Is PintDex free?',
      a: 'Yep — completely free. No app download, no sign-up, no ads. Just Perth pint prices, sorted.',
    },
  ]

  return (
    <section className="py-16 sm:py-20 border-t border-stone-200/60">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-title text-charcoal font-heading text-center mb-4">
          Questions?
        </h2>
        <p className="text-stone-500 text-center mb-10 text-lg">Everything you need to know about PintDex.</p>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-stone-200/60">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-lg font-semibold text-charcoal group-hover:text-amber transition-colors pr-4">
                  {faq.q}
                </span>
                <svg
                  className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="pb-5 text-stone-600 leading-relaxed -mt-1">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
