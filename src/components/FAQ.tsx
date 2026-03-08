'use client'

import { useState } from 'react'
import { useInView } from '@/hooks/useInView'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref: faqRef, inView: faqInView } = useInView()

  const faqs = [
    {
      q: 'How accurate are the prices?',
      a: 'Every price is verified through menus, direct calls, or community submissions. If we haven\'t confirmed a price, you\'ll see "Price TBC" instead of a guess.',
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
      a: 'Absolutely. Hit "Submit a Price" in the top nav or use the Report button on any pub page.',
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
    <section className="py-14 px-6 bg-off-white bg-noise relative">
      <div ref={faqRef} className={`max-w-container mx-auto reveal ${faqInView ? 'in-view' : ''}`}>
        <h2 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-gray-mid mb-6">
          FAQ
        </h2>
        <div>
          {faqs.map((faq, i) => (
            <div key={i} className={i < faqs.length - 1 ? 'border-b border-gray-light' : ''}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <span className="font-body text-base font-semibold text-ink group-hover:text-amber transition-colors pr-4">
                  {faq.q}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-mid flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="pb-4 text-gray-mid leading-relaxed text-sm -mt-1">
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
