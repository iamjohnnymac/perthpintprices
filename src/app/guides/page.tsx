import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import Link from 'next/link'

const guideCards = [
  {
    href: '/guides/beer-weather',
    icon: '🌤',
    title: 'Beer Weather',
    tagline: "Is it beer garden weather? We'll check the Bureau of Meteorology so you don't have to.",
    color: 'from-sky-50 to-cyan-50',
    accent: 'border-sky-200/60',
  },
  {
    href: '/guides/sunset-sippers',
    icon: '🌅',
    title: 'Sunset Sippers',
    tagline: 'West-facing patios and rooftop bars for golden hour pints.',
    color: 'from-orange-50 to-amber-50',
    accent: 'border-orange-200/60',
  },
  {
    href: '/guides/punt-and-pints',
    icon: '🏇',
    title: 'Punt & Pints',
    tagline: 'TAB screens, cold pints, and a flutter on the trots. The classic combo.',
    color: 'from-emerald-50 to-green-50',
    accent: 'border-emerald-200/60',
  },
  {
    href: '/guides/dad-bar',
    icon: '👨',
    title: 'The Dad Bar',
    tagline: "No fairy lights, no craft beer menu. Just honest pints and the footy on.",
    color: 'from-stone-100 to-stone-50',
    accent: 'border-stone-300/60',
  },
  {
    href: '/guides/cozy-corners',
    icon: '☔',
    title: 'Cozy Corners',
    tagline: "When it's bucketing down, these spots have fireplaces, booths, and warmth.",
    color: 'from-violet-50 to-purple-50',
    accent: 'border-violet-200/60',
  },
  {
    href: '/happy-hour',
    icon: '⏰',
    title: 'Happy Hour',
    tagline: "Live happy hour deals happening right now across Perth. Don't miss out.",
    color: 'from-yellow-50 to-amber-50',
    accent: 'border-yellow-200/60',
  },
  {
    href: '/pub-golf',
    icon: '⛳',
    title: 'Pub Golf',
    tagline: '9 holes. 9 pubs. Score your round and settle the debate.',
    color: 'from-green-50 to-lime-50',
    accent: 'border-green-200/60',
  },
  {
    href: '/pint-crawl',
    icon: '🗺️',
    title: 'Pint Crawl',
    tagline: 'Plot your route, pick your pubs, and share the plan with your mates.',
    color: 'from-blue-50 to-indigo-50',
    accent: 'border-blue-200/60',
  },
  {
    href: '/leaderboard',
    icon: '🏆',
    title: 'Leaderboard',
    tagline: 'The legends keeping Perth pint prices honest. Top scouts ranked.',
    color: 'from-amber-50 to-yellow-50',
    accent: 'border-amber-200/60',
  },
]

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[{ label: 'Guides' }]} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Guides</h1>
          <p className="text-stone-warm mt-2 text-sm sm:text-base">
            Curated pub picks for every mood, every season, every excuse to go out.
          </p>
        </div>

        <div className="space-y-4">
          {guideCards.map(card => (
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
