import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top row: Logo + tagline */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-amber text-2xl">✳</span>
            <span className="font-serif text-2xl">arvo</span>
          </div>
          <p className="text-stone-400 text-sm">Perth&apos;s pint prices, sorted.</p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-4 pb-5 border-b border-stone-700/60">
          <div>
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/happy-hour" className="text-sm text-stone-300 hover:text-white transition-colors">Happy Hours</Link></li>
              <li><Link href="/pub-golf" className="text-sm text-stone-300 hover:text-white transition-colors">Pub Golf</Link></li>
              <li><Link href="/pint-crawl" className="text-sm text-stone-300 hover:text-white transition-colors">Pint Crawl</Link></li>
              <li><Link href="/leaderboard" className="text-sm text-stone-300 hover:text-white transition-colors">Leaderboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Beer Sizes</h4>
            <ul className="space-y-2">
              <li className="text-sm text-stone-300">Middy <span className="text-stone-500">285ml</span></li>
              <li className="text-sm text-stone-300">Schooner <span className="text-stone-500">425ml</span></li>
              <li className="text-sm text-amber font-medium">Pint <span className="text-stone-500">570ml</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">About</h4>
            <ul className="space-y-2">
              <li className="text-sm text-stone-300">Community-driven</li>
              <li className="text-sm text-stone-300">100% real prices</li>
              <li className="text-sm text-stone-300">Updated weekly</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:perthpintprices@gmail.com" className="text-sm text-stone-300 hover:text-white transition-colors">
                  Email us
                </a>
              </li>
              <li>
                <a
                  href="mailto:perthpintprices@gmail.com?subject=Price%20Correction"
                  className="text-sm text-amber hover:text-amber-light transition-colors"
                >
                  Report wrong price
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-500 text-xs">© {new Date().getFullYear()} Arvo. Prices may vary. Drink responsibly.</p>
          <p className="text-stone-600 text-xs">Made in Perth 🌊</p>
        </div>
      </div>
    </footer>
  )
}
