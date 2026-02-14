interface FilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  suburb: string;
  setSuburb: (value: string) => void;
  suburbs: string[];
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  happyHourOnly: boolean;
  setHappyHourOnly: (value: boolean) => void;
}

export function FilterBar({
  search,
  setSearch,
  suburb,
  setSuburb,
  suburbs,
  maxPrice,
  setMaxPrice,
  happyHourOnly,
  setHappyHourOnly,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 mb-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pub name or address..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Suburb */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
          <select
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">All suburbs</option>
            {suburbs.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price: ${maxPrice}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Happy Hour Toggle */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={happyHourOnly}
              onChange={(e) => setHappyHourOnly(e.target.checked)}
              className="w-5 h-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700">
              🕐 Happy Hour Now
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
