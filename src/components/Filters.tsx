'use client'

interface FiltersProps {
  maxPrice: number
  setMaxPrice: (price: number) => void
  showHappyHourOnly: boolean
  setShowHappyHourOnly: (show: boolean) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: 'price' | 'name' | 'distance'
  setSortBy: (sort: 'price' | 'name' | 'distance') => void
}

export default function Filters({
  maxPrice,
  setMaxPrice,
  showHappyHourOnly,
  setShowHappyHourOnly,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy
}: FiltersProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-slate-700/50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Search
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search pubs, suburbs, or beer types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-beer-gold transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Max Price
          </label>
          <div className="relative">
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:border-beer-gold transition-colors cursor-pointer"
            >
              <option value={8}>Up to $8</option>
              <option value={9}>Up to $9</option>
              <option value={10}>Up to $10</option>
              <option value={12}>Up to $12</option>
              <option value={15}>Up to $15</option>
              <option value={20}>Up to $20</option>
              <option value={50}>Any price</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Sort By
          </label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'name' | 'distance')}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:border-beer-gold transition-colors cursor-pointer"
            >
              <option value="price">💰 Price (Low → High)</option>
              <option value="name">🔤 Name (A → Z)</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</span>
          </div>
        </div>
      </div>

      {/* Happy Hour Toggle */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <button
          onClick={() => setShowHappyHourOnly(!showHappyHourOnly)}
          className={`w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
            showHappyHourOnly
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
          }`}
        >
          <span className="relative flex h-3 w-3">
            {showHappyHourOnly && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </>
            )}
            {!showHappyHourOnly && (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-500"></span>
            )}
          </span>
          <span>🕐 Happy Hour Now Only</span>
        </button>
      </div>
    </div>
  )
}
