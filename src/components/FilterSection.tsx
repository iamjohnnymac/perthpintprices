"use client"

import { MapPin, Search } from 'lucide-react'

interface FilterSectionProps {
  viewMode: 'cards' | 'list'
  setViewMode: (mode: 'cards' | 'list') => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedSuburb: string
  setSelectedSuburb: (suburb: string) => void
  suburbs: string[]
  showHappyHourOnly: boolean
  setShowHappyHourOnly: (show: boolean) => void
  showMiniMaps: boolean
  setShowMiniMaps: (show: boolean) => void
  sortBy: 'price' | 'name' | 'suburb' | 'nearest' | 'freshness'
  setSortBy: (sort: 'price' | 'name' | 'suburb' | 'nearest' | 'freshness') => void
  maxPrice: number
  setMaxPrice: (price: number) => void
  showMoreFilters: boolean
  setShowMoreFilters: (show: boolean) => void
  stats: { happyHourNow: number }
  hasLocation?: boolean
  locationState?: 'idle' | 'granted' | 'denied' | 'dismissed'
  requestLocation?: () => void
  nearbyRadius?: number
  setNearbyRadius?: (radius: number) => void
  vibeTagFilter: string
  setVibeTagFilter: (vibe: string) => void
  kidFriendlyOnly: boolean
  setKidFriendlyOnly: (val: boolean) => void
  hasTabOnly: boolean
  setHasTabOnly: (val: boolean) => void
}

const selectClasses = "w-full font-mono text-[0.8rem] font-bold bg-white border-3 border-ink rounded-pill px-3 py-3 appearance-none cursor-pointer truncate bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%270%200%2012%208%27%20fill%3D%27none%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201.5L6%206.5L11%201.5%27%20stroke%3D%27%23171717%27%20stroke-width%3D%272.5%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center] pr-7"

export function FilterSection({
  searchTerm,
  setSearchTerm,
  selectedSuburb,
  setSelectedSuburb,
  suburbs,
  sortBy,
  setSortBy,
  hasLocation,
  locationState,
  requestLocation,
  nearbyRadius = 5,
  setNearbyRadius,
}: FilterSectionProps) {
  const handleNearestClick = () => {
    if (hasLocation) {
      setSortBy('nearest')
      setSelectedSuburb('all')
    } else if (requestLocation) {
      requestLocation()
    }
  }

  return (
    <div className="max-w-container mx-auto px-6 mb-6 space-y-2.5">
      {/* Single row on desktop, 2 rows on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-0">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pubs by name..."
            className="w-full font-mono text-[0.85rem] bg-white border-3 border-ink rounded-pill pl-11 pr-5 py-3 text-ink placeholder:text-gray-mid/50 focus:outline-none focus:border-amber transition-colors sm:placeholder:text-transparent"
          />
          <span className="hidden sm:block absolute left-11 top-1/2 -translate-y-1/2 font-mono text-[0.85rem] text-gray-mid/50 pointer-events-none" style={{ display: searchTerm ? 'none' : undefined }}>
            Search...
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] text-gray-mid hover:text-ink transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters + Sort (row 2 on mobile, inline on desktop) */}
        <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
          {sortBy === 'nearest' && hasLocation ? (
            <select
              value={nearbyRadius}
              onChange={(e) => setNearbyRadius?.(Number(e.target.value))}
              className={`${selectClasses} flex-1 min-w-0 sm:flex-none sm:w-auto sm:min-w-[150px] text-ink`}
            >
              <option value={1}>Within 1 km</option>
              <option value={3}>Within 3 km</option>
              <option value={5}>Within 5 km</option>
              <option value={0}>All distances</option>
            </select>
          ) : (
            <select
              value={selectedSuburb || 'all'}
              onChange={(e) => setSelectedSuburb(e.target.value)}
              className={`${selectClasses} flex-1 min-w-0 sm:flex-none sm:w-auto sm:min-w-[150px] ${selectedSuburb && selectedSuburb !== 'all' ? 'text-ink' : 'text-gray-mid'}`}
            >
              <option value="all">Suburbs</option>
              {suburbs.map(suburb => (
                <option key={suburb} value={suburb}>{suburb}</option>
              ))}
            </select>
          )}

          <div className="bg-white border-3 border-ink rounded-pill overflow-hidden flex shrink-0 sm:min-w-[170px]">
            <button
              onClick={() => setSortBy('price')}
              className={`flex-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.04em] px-2 sm:px-3 py-3 transition-all ${
                sortBy === 'price' ? 'bg-ink text-white' : 'text-gray-mid'
              }`}
            >
              $<span className="hidden sm:inline"> Price</span>
            </button>
            <button
              onClick={handleNearestClick}
              className={`flex-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.04em] px-2 sm:px-3 py-3 transition-all flex items-center justify-center gap-1 ${
                sortBy === 'nearest' ? 'bg-blue text-white' : 'text-gray-mid'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline">Near</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
