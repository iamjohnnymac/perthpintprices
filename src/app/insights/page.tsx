import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import Link from 'next/link'

const insightCards = [
  {
    href: '/insights/pint-of-the-day',
    icon: '🍺',
    title: 'Pint of the Day',
    tagline: 'The single best-value pint in Perth right now.',
    color: 'from-amber-50 to-orange-50',
    accent: 'border-amber-200/60',
  },
  {
    href: '/insights/pint-index',
    icon: '📈',
    title: 'Perth Pint Index™',
    tagline: 'Tracking the real cost of a pint across the city — updated live.',
    color: 'from-emerald-50 to-teal-50',
    accent: 'border-emerald-200/60',
  },
  {
    href: '/insights/tonights-best-bets',
    icon: '🌙',
    title: "Tonight's Best Bets",
    tagline: 'The cheapest pints pouring right now, sorted by what\'s open.',
    color: 'from-indigo-50 to-violet-50',
    accent: 'border-indigo-200/60',
  },
  {
    href: '/insights/suburb-rankings',
    icon: '🏘️',
    title: 'Suburb Rankings',
    tagline: 'Which Perth suburbs are winning the pint price war?',
    color: 'from-rose-50 to-pink-50',
    accent: 'border-rose-200/60',
  },
  {
    href: '/insights/venue-breakdown',
    icon: '🔍',
    title: 'Venue Breakdown',
    tagline: 'Price brackets, chains vs independents, and the full venue picture.',
    color: 'from-sky-50 to-blue-50',
    accent: 'border-sky-200/60',
  },
]

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[{ label: 'Insights' }]} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Insights</h1>
          <p className="text-stone-warm mt-2 text-sm sm:text-base">
            The numbers behind Perth&apos;s pint scene — all sourced from real, verified prices.
          </p>
        </div>

        <div className="space-y-4">
          {insightCards.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className={`block bg-gradient-to-r ${card.color} rounded-2xl p-5 sm:p-6 border ${card.accent} hover:shadow-lg hover:scale-[1.01] transition-all group`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl sm:text-4xl flex-shrink-0">{card.icon}</span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-charcoal text-base sm:text-lg group-hover:text-amber transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-sm text-charcoal/60 mt-0.5">{card.tagline}</p>
                </div>
                <svg className="w-5 h-5 text-stone-400 group-hover:text-amber flex-shrink-0 mt-1 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  )
}
