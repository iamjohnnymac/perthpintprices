'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface PriceSnapshot {
  snapshot_date: string;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  total_pubs: number;
  total_suburbs: number;
  cheapest_suburb: string;
  cheapest_suburb_avg: number;
  most_expensive_suburb: string;
  most_expensive_suburb_avg: number;
  price_distribution: Record<string, number>;
}

// SVG Sparkline component - lightweight, no dependencies
function Sparkline({ data, width = 280, height = 60 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data) - 0.1;
  const max = Math.max(...data) + 0.1;
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  // Gradient fill area
  const firstY = height - ((data[0] - min) / range) * (height - 8) - 4;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 8) - 4;
  const areaPoints = `0,${height} 0,${firstY} ${points} ${width},${lastY} ${width},${height}`;

  // Determine trend color
  const trend = data[data.length - 1] - data[0];
  const color = trend > 0 ? '#ef4444' : trend < 0 ? '#22c55e' : '#eab308';
  const gradientId = `sparkGrad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle
        cx={width}
        cy={lastY}
        r="4"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
}

// Mini bar chart for price distribution
function DistributionBars({ distribution }: { distribution: Record<string, number> }) {
  const ranges = ['$6-7', '$7-8', '$8-9', '$9-10', '$10-11', '$11-12'];
  const values = ranges.map(r => distribution[r] || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1 h-10">
      {ranges.map((range, i) => (
        <div key={range} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className="w-full rounded-sm transition-all duration-500"
            style={{
              height: `${Math.max((values[i] / maxVal) * 32, 2)}px`,
              backgroundColor: i <= 1 ? '#22c55e' : i <= 3 ? '#eab308' : '#ef4444',
              opacity: 0.8
            }}
          />
          <span className="text-[9px] text-stone-500 leading-none">{range.replace('$', '')}</span>
        </div>
      ))}
    </div>
  );
}

export default function PintIndex() {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchSnapshots() {
      const { data, error } = await supabase
        .from('price_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true });
      
      if (data && !error) {
        setSnapshots(data.map(d => ({
          ...d,
          avg_price: parseFloat(d.avg_price),
          median_price: parseFloat(d.median_price),
          min_price: parseFloat(d.min_price),
          max_price: parseFloat(d.max_price),
          cheapest_suburb_avg: parseFloat(d.cheapest_suburb_avg),
          most_expensive_suburb_avg: parseFloat(d.most_expensive_suburb_avg),
        })));
      }
      setLoading(false);
    }
    fetchSnapshots();
  }, []);

  if (loading || snapshots.length === 0) return null;

  const current = snapshots[snapshots.length - 1];
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
  const oldest = snapshots[0];

  // Calculate changes
  const monthChange = previous ? current.avg_price - previous.avg_price : 0;
  const monthPct = previous ? ((monthChange / previous.avg_price) * 100) : 0;
  const yearChange = current.avg_price - oldest.avg_price;
  const yearPct = ((yearChange / oldest.avg_price) * 100);

  const sparkData = snapshots.map(s => s.avg_price);
  const trendIcon = monthChange > 0 ? '📈' : monthChange < 0 ? '📉' : '➡️';
  const trendColor = monthChange > 0 ? 'text-red-500' : monthChange < 0 ? 'text-green-500' : 'text-yellow-500';

  return (
    <Card 
      className="mb-6 border-stone-200 bg-gradient-to-r from-stone-50 to-amber-50/30 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        {/* Main ticker row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Index title + value */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Perth Pint Index™</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-stone-300 text-stone-500">
                  LIVE
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold text-stone-800">${current.avg_price.toFixed(2)}</span>
                <span className={`text-sm font-semibold ${trendColor}`}>
                  {trendIcon} {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(2)} ({monthPct >= 0 ? '+' : ''}{monthPct.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Average pint price across {current.total_pubs} pubs · {current.total_suburbs} suburbs
              </p>
            </div>
          </div>
          
          {/* Right: Sparkline */}
          <div className="hidden sm:block">
            <div className="text-[10px] text-stone-400 mb-1 text-right">12-month trend</div>
            <Sparkline data={sparkData} />
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-stone-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Key stats */}
              <div>
                <div className="text-xs text-stone-500 mb-1">Cheapest Pint</div>
                <div className="text-lg font-bold text-green-600">${current.min_price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-stone-500 mb-1">Most Expensive</div>
                <div className="text-lg font-bold text-red-500">${current.max_price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-stone-500 mb-1">Median Price</div>
                <div className="text-lg font-bold text-stone-700">${current.median_price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-stone-500 mb-1">12-Month Change</div>
                <div className={`text-lg font-bold ${yearChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {yearChange >= 0 ? '+' : ''}{yearPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Suburb highlights */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700 font-medium">🏆 Cheapest Suburb</div>
                <div className="text-sm font-bold text-green-800 mt-1">{current.cheapest_suburb}</div>
                <div className="text-xs text-green-600">avg ${current.cheapest_suburb_avg.toFixed(2)}/pint</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-700 font-medium">💸 Priciest Suburb</div>
                <div className="text-sm font-bold text-red-800 mt-1">{current.most_expensive_suburb}</div>
                <div className="text-xs text-red-600">avg ${current.most_expensive_suburb_avg.toFixed(2)}/pint</div>
              </div>
            </div>

            {/* Price distribution */}
            {current.price_distribution && (
              <div className="mt-4">
                <div className="text-xs text-stone-500 mb-2">Price Distribution</div>
                <DistributionBars distribution={current.price_distribution} />
              </div>
            )}

            {/* Mobile sparkline */}
            <div className="sm:hidden mt-4">
              <div className="text-xs text-stone-400 mb-1">12-month trend</div>
              <Sparkline data={sparkData} width={320} height={50} />
            </div>

            <p className="text-[10px] text-stone-400 mt-3 text-center">
              📊 The Perth Pint Index tracks average beer prices across the metro area. Updated weekly.
              {' · '}Click to collapse.
            </p>
          </div>
        )}

        {/* Collapse hint when not expanded */}
        {!expanded && (
          <p className="text-[10px] text-stone-400 mt-2 text-center">
            Click to see full breakdown · Cheapest suburb: {current.cheapest_suburb} (${current.cheapest_suburb_avg.toFixed(2)})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
