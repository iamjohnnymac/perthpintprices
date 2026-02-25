'use client'
import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = [
    {
      q: 'How accurate are the prices?',
      a: 'Real prices from real people. Every price is verified through menus, direct calls, or community submissions. No scraping, no guessing — if we don\'t have a confirmed price, you\'ll see "Price TBC".',
    },
    {
      q: 'How often are prices updated?',
      a: 'Arvo runs automated checks weekly and accepts community submissions around the clock. Every price includes a "last verified" date so you know how fresh it is.',
    },
    {
      q: 'What does the price represent?',
      a: 'All prices shown are for a standard pint (570ml) of the cheapest tap beer available at each venue. Happy hour prices are shown when they\'re currently active.',
    },
    {
      q: 'Can I submit a price?',
      a: 'Absolutely. Hit "Submit a Price" in the top nav or use the Report button on any pub page. You\'ll earn points on our leaderboard too.',
    },
    {
      q: 'Why is a pub showing "Price TBC"?',
      a: 'We only display prices we\'ve confirmed. "Price TBC" means we know the pub exists but haven\'t verified its current pint price yet. You can help by submitting it!',
    },
    {
      q: 'Is Arvo free?',
      a: '100%. No app download. No sign-up. Just prices. Simple as.',
    },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h2 className="font-serif text-3xl sm:text-4xl text-charcoal text-center mb-10">
          Questions?
        </h2>
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-stone-200/60">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-base sm:text-lg font-semibold text-charcoal group-hover:text-amber transition-colors pr-4">
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
                <div className="pb-5 text-stone-warm leading-relaxed text-sm -mt-1">
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
