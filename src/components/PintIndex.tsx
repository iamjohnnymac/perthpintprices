'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { fetchPriceSnapshots, type PriceSnapshot } from '@/lib/priceSnapshots';
import { BarChart3 } from 'lucide-react';

interface TooltipState {
  x: number;
  y: number;
  label: string;
  price: number;
  visible: boolean;
}

// SVG Sparkline component with month-by-month hover tooltip
function Sparkline({ data, snapshots, width = 280, height = 60 }: { 
  data: number[]; 
  snapshots: PriceSnapshot[];
  width?: number; 
  height?: number 
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, label: '', price: 0, visible: false });

  // All hooks must run unconditionally; the <2-points placeholder is returned
  // below, after the hooks. (Previously this early-returned before useCallback,
  // which crashed once the widget started rendering before snapshots loaded.)
  const hasData = data.length >= 2;
  const min = hasData ? Math.min(...data) - 0.1 : 0;
  const max = hasData ? Math.max(...data) + 0.1 : 1;
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const firstY = points[0]?.y ?? 0;
  const lastY = points[points.length - 1]?.y ?? 0;
  const areaPoints = `0,${height} 0,${firstY} ${polylinePoints} ${width},${lastY} ${width},${height}`;

  const trend = hasData ? data[data.length - 1] - data[0] : 0;
  const color = trend > 0 ? '#DC2626' : trend < 0 ? '#E8820C' : '#D97706';
  const gradientId = 'sparkGrad-pint-index';

  // Plain handlers (not useCallback) so Sparkline has no hooks after the
  // <2-points early return — the memoization wasn't needed for this small chart.
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (width / rect.width);

    // Find closest data point
    let closestIdx = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    const snap = snapshots[closestIdx];
    const date = new Date(snap.snapshot_date);
    const label = date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });

    setTooltip({
      x: points[closestIdx].x,
      y: points[closestIdx].y,
      label,
      price: data[closestIdx],
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(t => ({ ...t, visible: false }));
  };

  if (!hasData) return (
    <div className="bg-white rounded-card border border-gray-light/40 p-6 text-center">
      <p className="text-gray-mid text-sm">No price history data yet. Trends build over time.</p>
    </div>
  );

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width} 
        height={height} 
        className="overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Hover indicator dot */}
        {tooltip.visible && (
          <>
            <line 
              x1={tooltip.x} y1={0} x2={tooltip.x} y2={height}
              stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity="0.5"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color} stroke="white" strokeWidth="2" />
          </>
        )}
        {/* End dot (when not hovering) */}
        {!tooltip.visible && (
          <circle
            cx={width}
            cy={lastY}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>
      {/* Floating tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-50 bg-ink text-white text-xs rounded-card px-2 py-1 pointer-events-none whitespace-nowrap shadow-hard-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: tooltip.x > width * 0.75 ? 'translateX(-100%)' : tooltip.x < width * 0.25 ? 'translateX(0)' : 'translateX(-50%)',
          }}
        >
          <span className="font-semibold">${tooltip.price.toFixed(2)}</span>
          <span className="text-gray-mid ml-1">{tooltip.label}</span>
        </div>
      )}
    </div>
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
            className="w-full rounded-pill transition-all duration-500"
            style={{
              height: `${Math.max((values[i] / maxVal) * 32, 2)}px`,
              backgroundColor: i <= 1 ? '#E8820C' : i <= 3 ? '#D97706' : '#DC2626',
              opacity: 0.8
            }}
          />
          <span className="text-[9px] text-gray-mid leading-none">{range.replace('$', '')}</span>
        </div>
      ))}
    </div>
  );
}

export interface PintIndexLive {
  avgPrice: number;
  medianPrice: number;
  verifiedCount: number;
  pricedSuburbCount: number;
  cheapestSuburb: string;
  cheapestSuburbAvg: number;
  priciestSuburb: string;
  priciestSuburbAvg: number;
  distribution: Record<string, number>;
}

export default function PintIndex({ live }: { live: PintIndexLive }) {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchPriceSnapshots(supabase).then(setSnapshots);
  }, []);

  // Displayed figures are always the live canonical stats; the weekly snapshot
  // series drives only the sparkline shape and the % change.
  const latestSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const oldest = snapshots.length > 0 ? snapshots[0] : null;
  const hasTrend = snapshots.length >= 2;
  const weekChange = latestSnap ? live.avgPrice - latestSnap.avg_price : 0;
  const weekPct = latestSnap && latestSnap.avg_price ? (weekChange / latestSnap.avg_price) * 100 : 0;
  const overallChange = oldest ? live.avgPrice - oldest.avg_price : 0;
  const overallPct = oldest && oldest.avg_price ? (overallChange / oldest.avg_price) * 100 : 0;
  const sparkData = snapshots.map(s => s.avg_price);
  const trendIcon = weekChange > 0 ? '\u25b2' : weekChange < 0 ? '\u25bc' : '\u2014';
  const trendColor = weekChange > 0 ? 'text-red' : weekChange < 0 ? 'text-amber' : 'text-gray-mid';

  return (
    <Card
      className="bg-white rounded-card border-3 border-ink shadow-hard-sm cursor-pointer hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all duration-200"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-5 sm:p-6">
        {/* Main ticker row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Index title + value */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="type-card text-lg flex items-center">Perth Pint Index{'\u2122'}</h3>
                <span className="text-[10px] px-1.5 py-0 border border-gray rounded-pill text-gray-mid">
                  LIVE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold font-mono text-ink">${live.avgPrice.toFixed(2)}</span>
                {hasTrend && (
                  <span className={`text-sm font-semibold ${trendColor}`}>
                    {trendIcon} {weekChange >= 0 ? '+' : ''}{weekChange.toFixed(2)} ({weekPct >= 0 ? '+' : ''}{weekPct.toFixed(1)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-mid mt-0.5">
                Average pint price across {live.verifiedCount} pubs {'\u00B7'} {live.pricedSuburbCount} suburbs
              </p>
            </div>
          </div>
          
          {/* Right: Sparkline with hover */}
          <div className="hidden sm:block" onClick={e => e.stopPropagation()}>
            <div className="text-[10px] text-gray-mid mb-1 text-right">Price trend {'\u00B7'} hover to explore</div>
            {hasTrend ? (
              <Sparkline data={sparkData} snapshots={snapshots} />
            ) : (
              <div className="w-[280px] h-[60px] flex items-center justify-center">
                <p className="text-[10px] text-gray-mid">Trend builds over time</p>
              </div>
            )}
          </div>
        </div>

        {/* Expanded: Trend analysis only (stats are in the header bar) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-light animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Suburb comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber/10 rounded-card p-3">
                <div className="text-[10px] text-amber font-semibold">▼ Cheapest Suburb</div>
                <div className="text-sm font-bold text-ink mt-1">{live.cheapestSuburb}</div>
                <div className="text-xs text-amber font-mono">avg ${live.cheapestSuburbAvg.toFixed(2)}/pint</div>
              </div>
              <div className="bg-red/10 rounded-card p-3">
                <div className="text-[10px] text-red font-semibold">▲ Priciest Suburb</div>
                <div className="text-sm font-bold text-ink mt-1">{live.priciestSuburb}</div>
                <div className="text-xs text-red font-mono">avg ${live.priciestSuburbAvg.toFixed(2)}/pint</div>
              </div>
            </div>

            {/* Year-over-year change */}
            <div className="flex items-center justify-between mt-4 px-1">
              <div>
                <div className="text-[10px] text-gray-mid font-medium">Overall Change</div>
                <div className={`text-lg font-bold font-mono ${overallChange > 0 ? 'text-red' : overallChange < 0 ? 'text-amber' : 'text-gray-mid'}`}>
                  {hasTrend ? `${overallChange >= 0 ? '+' : ''}${overallPct.toFixed(1)}%` : '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-mid font-medium">Median</div>
                <div className="text-lg font-bold font-mono text-ink-light">${live.medianPrice.toFixed(2)}</div>
              </div>
            </div>

            {/* Price distribution */}
            {live.distribution && Object.keys(live.distribution).length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] text-gray-mid font-medium mb-2">Price Distribution</div>
                <DistributionBars distribution={live.distribution} />
              </div>
            )}

            {/* Mobile sparkline */}
            <div className="sm:hidden mt-4" onClick={e => e.stopPropagation()}>
              <div className="text-[10px] text-gray-mid mb-1">Price trend {'\u00B7'} tap to explore</div>
              {hasTrend ? (
                <Sparkline data={sparkData} snapshots={snapshots} width={280} height={50} />
              ) : (
                <div className="h-[50px] flex items-center justify-center">
                  <p className="text-[10px] text-gray-mid">Trend builds over time</p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-mid mt-3 text-center flex items-center justify-center gap-1">
              <BarChart3 className="w-3 h-3 inline" /> Tracking Perth beer prices weekly. Click to collapse.
            </p>
          </div>
        )}

        {/* Collapse hint when not expanded */}
        {!expanded && (
          <p className="text-[10px] text-gray-mid mt-2 text-center">
            Click to see full breakdown {'\u00B7'} Cheapest suburb: {live.cheapestSuburb} (${live.cheapestSuburbAvg.toFixed(2)})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
