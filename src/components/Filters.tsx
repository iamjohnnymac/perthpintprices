'use client';

interface FiltersProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  happyHourOnly: boolean;
  onHappyHourChange: (value: boolean) => void;
  selectedSuburb: string;
  onSuburbChange: (suburb: string) => void;
  suburbs: string[];
}

export default function Filters({
  priceRange,
  onPriceChange,
  happyHourOnly,
  onHappyHourChange,
  selectedSuburb,
  onSuburbChange,
  suburbs
}: FiltersProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Max Price:</label>
          <select
            value={priceRange[1]}
            onChange={(e) => onPriceChange([priceRange[0], parseInt(e.target.value)])}
            className="bg-gray-700 text-white rounded px-3 py-2 text-sm"
          >
            {[7, 8, 9, 10, 15, 20].map(price => (
              <option key={price} value={price}>${price}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Suburb:</label>
          <select
            value={selectedSuburb}
            onChange={(e) => onSuburbChange(e.target.value)}
            className="bg-gray-700 text-white rounded px-3 py-2 text-sm"
          >
            <option value="">All Suburbs</option>
            {suburbs.map(suburb => (
              <option key={suburb} value={suburb}>{suburb}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onHappyHourChange(!happyHourOnly)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            happyHourOnly
              ? 'bg-beer-gold text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🍺 Happy Hour Now
        </button>
      </div>
    </div>
  );
}