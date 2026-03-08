"use client"

import { MapPin } from 'lucide-react'

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
  beerTypes?: string[]
  beerTypeFilter?: string
  setBeerTypeFilter?: (type: string) => void
  vibeTagFilter: string
  setVibeTagFilter: (vibe: string) => void
  kidFriendlyOnly: boolean
  setKidFriendlyOnly: (val: boolean) => void
  hasTabOnly: boolean
  setHasTabOnly: (val: boolean) => void
}

export function FilterSection({
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
  beerTypes = [],
  beerTypeFilter = '',
  setBeerTypeFilter,
}: FilterSectionProps) {
  const handleNearestClick = () => {
    if (hasLocation) {
      setSortBy('nearest')
    } else if (requestLocation) {
      requestLocation()
    }
  }

  return (
    <div className="max-w-container mx-auto px-6 mb-2 space-y-2">
      <div className="flex gap-2.5 items-center">
        {/* Suburb select */}
        <select
          value={selectedSuburb || 'all'}
          onChange={(e) => setSelectedSuburb(e.target.value)}
          className="flex-1 font-body text-[0.9rem] font-semibold bg-white border-3 border-ink rounded-pill px-5 py-3 text-ink appearance-none cursor-pointer bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%270%200%2012%208%27%20fill%3D%27none%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201.5L6%206.5L11%201.5%27%20stroke%3D%27%23171717%27%20stroke-width%3D%272.5%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_18px_center]"
        >
          <option value="all">All suburbs</option>
          {suburbs.map(suburb => (
            <option key={suburb} value={suburb}>{suburb}</option>
          ))}
        </select>

        {/* Beer type filter */}
        {beerTypes.length > 0 && setBeerTypeFilter && (
          <select
            value={beerTypeFilter}
            onChange={(e) => setBeerTypeFilter(e.target.value)}
            className="font-body text-[0.9rem] font-semibold bg-white border-3 border-ink rounded-pill px-4 py-3 text-ink appearance-none cursor-pointer bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%270%200%2012%208%27%20fill%3D%27none%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cpath%20d%3D%27M1%201.5L6%206.5L11%201.5%27%20stroke%3D%27%23171717%27%20stroke-width%3D%272.5%27%20stroke-linecap%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_14px_center] pr-9 max-w-[160px]"
          >
            <option value="">All beers</option>
            {beerTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}

        {/* Sort toggle - NEAREST always visible */}
        <div className="bg-white border-3 border-ink rounded-pill overflow-hidden flex">
          <button
            onClick={() => setSortBy('price')}
            className={`font-mono text-[0.7rem] font-bold uppercase tracking-[0.04em] px-4 py-3 transition-all ${
              sortBy === 'price' ? 'bg-ink text-white' : 'text-gray-mid'
            }`}
          >
            Cheapest
          </button>
          <button
            onClick={handleNearestClick}
            className={`font-mono text-[0.7rem] font-bold uppercase tracking-[0.04em] px-4 py-3 transition-all flex items-center gap-1.5 ${
              sortBy === 'nearest' ? 'bg-blue text-white' : 'text-gray-mid'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {locationState === 'idle' && !hasLocation ? 'Near Me' : 'Nearest'}
          </button>
        </div>
      </div>

      {/* Radius pills - only when sorting by nearest */}
      {sortBy === 'nearest' && hasLocation && setNearbyRadius && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.06em] text-gray-mid">Within</span>
          {[1, 3, 5, 0].map((r) => (
            <button
              key={r}
              onClick={() => setNearbyRadius(r)}
              className={`font-mono text-[0.65rem] font-bold uppercase tracking-[0.04em] px-3 py-1.5 rounded-pill border-2 transition-all ${
                nearbyRadius === r
                  ? 'bg-blue text-white border-blue'
                  : 'bg-white text-gray-mid border-gray-light hover:border-blue'
              }`}
            >
              {r === 0 ? 'All' : `${r}km`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
