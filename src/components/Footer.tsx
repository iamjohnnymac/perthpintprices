export default function Footer() {
  return (
    <footer className="bg-charcoal text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PintDex" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-xl font-bold tracking-tight font-heading">PintDex</span>
          </div>
          <p className="text-stone-400 text-sm text-center">Perth&apos;s pint prices, sorted. Community-driven since 2024.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-8 pb-8 border-b border-stone-700">
          <div className="flex items-center gap-2">
            <span className="text-amber text-lg">⬡</span>
            <div>
              <p className="font-semibold text-white">Schooner</p>
              <p className="text-xs text-stone-400">425ml</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber text-lg">⬡</span>
            <div>
              <p className="font-semibold text-amber">Pint</p>
              <p className="text-xs text-stone-400">570ml</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber text-lg">⬡</span>
            <div>
              <p className="font-semibold text-white">Long Neck</p>
              <p className="text-xs text-stone-400">750ml</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-stone-400 text-xs">Prices may vary. Pint prices shown. Always drink responsibly.</p>
          <a
            href="mailto:perthpintprices@gmail.com?subject=Price%20Correction&body=Hi%2C%20I%20noticed%20a%20wrong%20price%20on%20the%20site.%0A%0APub%20name%3A%20%0ACorrect%20price%3A%20%0ADetails%3A%20"
            className="inline-block mt-3 text-amber hover:text-amber-light text-xs"
          >
            Report Wrong Price
          </a>
        </div>
      </div>
    </footer>
  )
}
