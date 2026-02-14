'use client';

import { useState, useMemo } from 'react';
import { pubs } from '@/data/pubs';
import { PubCard } from '@/components/PubCard';
import { FilterBar } from '@/components/FilterBar';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map').then(mod => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-amber-50 rounded-xl flex items-center justify-center">
      <div className="text-amber-600">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const [search, setSearch] = useState('');
  const [suburb, setSuburb] = useState('');
  const [maxPrice, setMaxPrice] = useState(20);
  const [happyHourOnly, setHappyHourOnly] = useState(false);

  const suburbs = useMemo(() => {
    const uniqueSuburbs = new Set(pubs.map(p => p.suburb));
    return Array.from(uniqueSuburbs).sort();
  }, []);

  const isHappyHourNow = (times: string): boolean => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = now.getHours();
    const timesLower = times.toLowerCase();
    
    if (timesLower.includes('daily') || timesLower.includes('every day')) {
      const hourMatch = timesLower.match(/(\d{1,2})(?:am|pm)?\s*[-–]\s*(\d{1,2})(?:am|pm)?/i);
      if (hourMatch) {
        let start = parseInt(hourMatch[1]);
        let end = parseInt(hourMatch[2]);
        if (timesLower.includes('pm') && start < 12) start += 12;
        if (timesLower.includes('pm') && end < 12) end += 12;
        return hour >= start && hour < end;
      }
      return true;
    }
    
    return timesLower.includes(day.toLowerCase());
  };

  const filteredPubs = useMemo(() => {
    return pubs.filter(pub => {
      const matchesSearch = !search || 
        pub.name.toLowerCase().includes(search.toLowerCase()) ||
        pub.address.toLowerCase().includes(search.toLowerCase());
      const matchesSuburb = !suburb || pub.suburb === suburb;
      const matchesPrice = pub.price <= maxPrice;
      const matchesHappyHour = !happyHourOnly || isHappyHourNow(pub.times);
      
      return matchesSearch && matchesSuburb && matchesPrice && matchesHappyHour;
    }).sort((a, b) => a.price - b.price);
  }, [search, suburb, maxPrice, happyHourOnly]);

  const pubsWithCoords = filteredPubs.filter(p => p.lat && p.lng);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero */}
      <div className="bg-amber-500 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">🍺 Perth Pint Prices</h1>
          <p className="text-xl md:text-2xl opacity-90">Find the cheapest pints in Perth, WA</p>
          <p className="mt-2 text-amber-100">Tracking {pubs.length} venues • Updated regularly</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          suburb={suburb}
          setSuburb={setSuburb}
          suburbs={suburbs}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          happyHourOnly={happyHourOnly}
          setHappyHourOnly={setHappyHourOnly}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
            <div className="text-3xl font-bold text-amber-600">{filteredPubs.length}</div>
            <div className="text-gray-600 text-sm">Venues</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
            <div className="text-3xl font-bold text-green-600">
              ${filteredPubs.length > 0 ? Math.min(...filteredPubs.map(p => p.price)).toFixed(0) : '0'}
            </div>
            <div className="text-gray-600 text-sm">Cheapest</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
            <div className="text-3xl font-bold text-amber-600">
              ${filteredPubs.length > 0 ? (filteredPubs.reduce((a, b) => a + b.price, 0) / filteredPubs.length).toFixed(0) : '0'}
            </div>
            <div className="text-gray-600 text-sm">Average</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
            <div className="text-3xl font-bold text-red-500">
              ${filteredPubs.length > 0 ? Math.max(...filteredPubs.map(p => p.price)).toFixed(0) : '0'}
            </div>
            <div className="text-gray-600 text-sm">Priciest</div>
          </div>
        </div>

        {/* Map */}
        {pubsWithCoords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Map View</h2>
            <Map pubs={pubsWithCoords} />
          </div>
        )}

        {/* Pub List */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🍻 All Venues</h2>
        {filteredPubs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No pubs match your filters. Try adjusting your search.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPubs.map((pub, i) => (
              <PubCard key={i} pub={pub} isHappyHour={isHappyHourNow(pub.times)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">Perth Pint Prices © {new Date().getFullYear()}</p>
          <p className="text-gray-500 text-sm mt-2">Prices sourced from public venues. Always confirm with the venue.</p>
        </div>
      </footer>
    </main>
  );
}
