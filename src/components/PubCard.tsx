'use client';

import { Pub } from '@/types/pub';

interface PubCardProps {
  pub: Pub;
  isHappyHourNow: boolean;
}

export default function PubCard({ pub, isHappyHourNow }: PubCardProps) {
  return (
    <div className={`bg-gray-800 rounded-xl p-4 border transition-all hover:border-beer-gold ${
      isHappyHourNow ? 'border-beer-gold happy-hour-active' : 'border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-white">{pub.name}</h3>
        <span className="text-2xl font-bold text-beer-gold">${pub.price}</span>
      </div>
      
      <p className="text-gray-400 text-sm mb-1">{pub.suburb}</p>
      <p className="text-gray-500 text-xs mb-3">{pub.address}</p>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
          {pub.beerType}
        </span>
        {isHappyHourNow && (
          <span className="bg-beer-gold text-black px-2 py-1 rounded text-xs font-semibold animate-pulse">
            🍺 HAPPY HOUR NOW!
          </span>
        )}
      </div>
      
      {pub.happyHour && (
        <p className="text-sm text-gray-400">
          <span className="text-beer-amber">Happy Hour:</span> {pub.happyHour.days.join(', ')} {pub.happyHour.start}-{pub.happyHour.end}
        </p>
      )}
    </div>
  );
}