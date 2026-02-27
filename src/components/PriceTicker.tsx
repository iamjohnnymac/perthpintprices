'use client';

import { useMemo } from 'react';
import { Pub } from '@/types/pub';
import E from '@/lib/emoji';

interface PriceTickerProps {
  pubs: Pub[];
}

interface SuburbTicker {
  suburb: string;
  avgPrice: number;
  pubCount: number;
  diff: number;
}

export default function PriceTicker({ pubs }: PriceTickerProps) {
  const tickers = useMemo<SuburbTicker[]>(() => {
    if (!pubs || pubs.length === 0) return [];

    const suburbMap: Record<string, number[]> = {};
    for (const pub of pubs) {
      if (!pub.suburb || pub.price == null) continue;
      const key = pub.suburb.trim();
      if (!suburbMap[key]) suburbMap[key] = [];
      suburbMap[key].push(Number(pub.price));
    }

    const allPrices = pubs.filter((p) => p.price != null).map((p) => Number(p.price));
    if (allPrices.length === 0) return [];
    const overallAvg = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

    return Object.entries(suburbMap)
      .filter(([, prices]) => prices.length >= 2)
      .map(([suburb, prices]) => {
        const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
        return { suburb, avgPrice: avg, pubCount: prices.length, diff: avg - overallAvg };
      })
      .sort((a, b) => a.suburb.localeCompare(b.suburb));
  }, [pubs]);

  if (tickers.length === 0) return (
    <div className="fixed bottom-0 left-0 right-0 bg-charcoal text-white/70 text-xs py-2 text-center z-50">
      Perth pint prices, sorted. ✳ arvo
    </div>
  );

  const items = [...tickers, ...tickers];
  const duration = Math.max(30, tickers.length * 2.5);

  return (
    <div className="w-full bg-charcoal border-t border-stone-700/40 overflow-hidden select-none fixed bottom-0 left-0 right-0" style={{ height: '36px', zIndex: 9999 }}>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-outer {
          pointer-events: none;
        }
        .ticker-track {
          display: inline-flex;
          width: max-content;
          animation: ticker-scroll ${duration}s linear infinite;
          will-change: transform;
        }
      `}</style>
      <div className="ticker-outer h-full">
        <div className="ticker-track items-center whitespace-nowrap h-full">
          {items.map((t, i) => {
            const isAboveAvg = t.diff >= 0;
            const arrow = isAboveAvg ? E.up_arrow : E.down_arrow;
            const color = isAboveAvg ? 'text-coral' : 'text-green-700';
            const diffStr = Math.abs(t.diff).toFixed(2);

            return (
              <span key={`${t.suburb}-${i}`} className="inline-flex items-center gap-2 px-4 text-xs tracking-wide" style={{ height: '36px' }}>
                <span className="font-semibold text-stone-300 uppercase text-xs sm:text-sm">
                  {t.suburb}
                </span>
                <span className="font-mono text-white font-bold text-sm">
                  ${t.avgPrice.toFixed(2)}
                </span>
                <span className={`font-mono ${color} text-[11px]`}>
                  {arrow} {diffStr}
                </span>
                <span className="text-stone-500 ml-2">·</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
