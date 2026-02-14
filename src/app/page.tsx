'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PubCard from '@/components/PubCard';
import Filters from '@/components/Filters';
import { isHappyHourNow } from '@/utils/happyHour';
import pubsData from '@/data/pubs.json';
import { Pub } from '@/types/pub';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-[400px] md:h-[600px] rounded-xl bg-gray-800 animate-pulse" />
});

export default function Home() {
  const pubs = pubsData as Pub[];
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20]);
  const [happyHourOnly, setHappyHourOnly] = useState(false);
  const [selectedSuburb, setSelectedSuburb] = useState('');

  const suburbs = useMemo(() => 
    [...new Set(pubs.map(p => p.suburb))].sort(),
    [pubs]
  );

  const filteredPubs = useMemo(() => {
    return pubs.filter(pub => {
      if (pub.price > priceRange[1]) return false;
      if (selectedSuburb && pub.suburb !== selectedSuburb) return false;
      if (happyHourOnly && !isHappyHourNow(pub)) return false;
      return true;
    }).sort((a, b) => a.price - b.price);
  }, [pubs, priceRange, selectedSuburb, happyHourOnly]);

  const happyHourCount = useMemo(() => 
    pubs.filter(p => isHappyHourNow(p)).length,
    [pubs]
  );

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="bg-gradient-to-r from-beer-dark to-gray-900 py-8 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            🍺 Perth Pint Prices
          </h1>
          <p className="text-gray-400 text-lg">
            Find the best value pints across Perth, WA
          </p>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="text-beer-gold font-semibold">{pubs.length} pubs</span>
            <span className="text-gray-500">|</span>
            <span className="text-green-400">{happyHourCount} in happy hour now</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Filters
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          happyHourOnly={happyHourOnly}
          onHappyHourChange={setHappyHourOnly}
          selectedSuburb={selectedSuburb}
          onSuburbChange={setSelectedSuburb}
          suburbs={suburbs}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="order-2 lg:order-1">
            <Map 
              pubs={filteredPubs} 
              selectedPub={selectedPub}
              onPubSelect={setSelectedPub}
            />
          </div>

          {/* Pub List */}
          <div className="order-1 lg:order-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {filteredPubs.length} Pubs Found
              </h2>
              <span className="text-sm text-gray-400">
                Sorted by price (lowest first)
              </span>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredPubs.map(pub => (
                <PubCard 
                  key={pub.id} 
                  pub={pub} 
                  isHappyHourNow={isHappyHourNow(pub)}
                />
              ))}
              {filteredPubs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-4">🍺</p>
                  <p>No pubs match your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Data sourced from eatdrinkcheap.com.au • Last updated: Feb 2025</p>
          <p className="mt-2">Know a price that's changed? Submit an update!</p>
        </footer>
      </div>
    </main>
  );
}