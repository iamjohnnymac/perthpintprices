'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import E from '@/lib/emoji';

interface SuburbTicker {
  suburb: string;
  avgPrice: number;
  pubCount: number;
  diff: number;
}

export default function PriceTicker() {
  const [tickers, setTickers] = useState<SuburbTicker[]>([]);

  useEffect(() => {
    async function fetchTickers() {
      const { data: pubs, error } = await supabase
        .from('pubs')
        .select('suburb, price');

      if (error || !pubs || pubs.length === 0) return;

      // Group by suburb
      const suburbMap: Record<string, number[]> = {};
      for (const pub of pubs) {
        if (!pub.suburb || pub.price == null) continue;
        const key = pub.suburb.trim();
        if (!suburbMap[key]) suburbMap[key] = [];
        suburbMap[key].push(Number(pub.price));
      }

      // Calculate overall average
      const allPrices = pubs
        .filter((p) => p.price != null)
        .map((p) => Number(p.price));
      const overallAvg =
        allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

      // Build ticker items: only suburbs with 2+ pubs
      const items: SuburbTicker[] = Object.entries(suburbMap)
        .filter(([, prices]) => prices.length >= 2)
        .map(([suburb, prices]) => {
          const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
          return {
            suburb,
            avgPrice: avg,
            pubCount: prices.length,
            diff: avg - overallAvg,
          };
        })
        .sort((a, b) => a.suburb.localeCompare(b.suburb));

      setTickers(items);
    }

    fetchTickers();
  }, []);

  if (tickers.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const items = [...tickers, ...tickers];
  const duration = Math.max(8, tickers.length * 0.4);

  return (
    <div className="w-full bg-slate-950 text-white overflow-hidden relative select-none" style={{ height: '38px', zIndex: 50 }}>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-track {
          animation: ticker-scroll ${duration}s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div
        className="ticker-track flex items-center whitespace-nowrap h-full"
      >
        {items.map((t, i) => {
          const isAboveAvg = t.diff >= 0;
          const arrow = isAboveAvg ? E.up_arrow : E.down_arrow;
          const color = isAboveAvg ? 'text-red-400' : 'text-emerald-400';
          const diffStr = Math.abs(t.diff).toFixed(2);

          return (
            <span key={`${t.suburb}-${i}`} className="inline-flex items-center gap-1.5 px-4 text-xs tracking-wide">
              <span className="font-semibold text-slate-300 uppercase text-[11px]">
                {t.suburb}
              </span>
              <span className="font-mono text-white text-[12px]">
                ${t.avgPrice.toFixed(2)}
              </span>
              <span className={`font-mono ${color} text-[11px]`}>
                {arrow} {diffStr}
              </span>
              {i < items.length - 1 && (
                <span className="text-slate-600 ml-2">{'\u2022'}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
