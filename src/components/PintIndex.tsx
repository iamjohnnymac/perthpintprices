'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { BarChart3 } from 'lucide-react';

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

  if (data.length < 2) return (
    <div className="bg-white rounded-card border border-gray-light/40 p-6 text-center">
      <p className="text-gray-mid text-sm">No price history data yet. Trends build over time.</p>
    </div>
  );
  
  const min = Math.min(...data) - 0.1;
  const max = Math.max(...data) + 0.1;
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const firstY = points[0].y;
  const lastY = points[points.length - 1].y;
  const areaPoints = `0,${height} 0,${firstY} ${polylinePoints} ${width},${lastY} ${width},${height}`;

  const trend = data[data.length - 1] - data[0];
  const color = trend > 0 ? '#DC2626' : trend < 0 ? '#E8820C' : '#D97706';
  const gradientId = 'sparkGrad-pint-index';

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
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
  }, [points, snapshots, data, width]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }));
  }, []);

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
          className="absolute z-50 bg-ink text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg"
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
            className="w-full rounded-sm transition-all duration-500"
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

export default function PintIndex() {
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

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

  if (loading) return (
    <div className="bg-white rounded-card border border-gray-light/40 p-6">
      <div className="h-6 w-48 bg-gray-light animate-pulse rounded mb-4" />
      <div className="h-40 bg-off-white animate-pulse rounded" />
    </div>
  );
  if (snapshots.length === 0) return (
    <div className="bg-white rounded-card border border-gray-light/40 p-6 text-center">
      <p className="text-gray-mid text-sm">No price history data yet. Trends build over time.</p>
    </div>
  );

  const current = snapshots[snapshots.length - 1];
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
  const oldest = snapshots[0];

  // Calculate changes
  const monthChange = previous ? current.avg_price - previous.avg_price : 0;
  const monthPct = previous ? ((monthChange / previous.avg_price) * 100) : 0;
  const yearChange = current.avg_price - oldest.avg_price;
  const yearPct = ((yearChange / oldest.avg_price) * 100);

  const sparkData = snapshots.map(s => s.avg_price);
  const trendIcon = monthChange > 0 ? '\u25b2' : monthChange < 0 ? '\u25bc' : '\u2014';
  const trendColor = monthChange > 0 ? 'text-coral' : monthChange < 0 ? 'text-amber' : 'text-yellow-500';

  return (
    <Card 
      className="bg-white rounded-card shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-gray-light/40 cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.995] transition-all duration-300"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-5 sm:p-6">
        {/* Main ticker row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Index title + value */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold font-heading text-ink flex items-center">Perth Pint Index{'\u2122'}</h3>
                <span className="text-[10px] px-1.5 py-0 border border-gray rounded-pill text-gray-mid">
                  LIVE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold font-mono text-ink">${current.avg_price.toFixed(2)}</span>
                <span className={`text-sm font-semibold ${trendColor}`}>
                  {trendIcon} {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(2)} ({monthPct >= 0 ? '+' : ''}{monthPct.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs text-gray-mid mt-0.5">
                Average pint price across {current.total_pubs} pubs {'\u00B7'} {current.total_suburbs} suburbs
              </p>
            </div>
          </div>
          
          {/* Right: Sparkline with hover */}
          <div className="hidden sm:block" onClick={e => e.stopPropagation()}>
            <div className="text-[10px] text-gray-mid mb-1 text-right">Price trend {'\u00B7'} hover to explore</div>
            <Sparkline data={sparkData} snapshots={snapshots} />
          </div>
        </div>

        {/* Expanded: Trend analysis only (stats are in the header bar) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-light animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Suburb comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber/10 rounded-xl p-3">
                <div className="text-[10px] text-amber font-semibold">▼ Cheapest Suburb</div>
                <div className="text-sm font-bold text-ink mt-1">{current.cheapest_suburb}</div>
                <div className="text-xs text-amber font-mono">avg ${current.cheapest_suburb_avg.toFixed(2)}/pint</div>
              </div>
              <div className="bg-coral/10 rounded-xl p-3">
                <div className="text-[10px] text-coral font-semibold">▲ Priciest Suburb</div>
                <div className="text-sm font-bold text-ink mt-1">{current.most_expensive_suburb}</div>
                <div className="text-xs text-coral font-mono">avg ${current.most_expensive_suburb_avg.toFixed(2)}/pint</div>
              </div>
            </div>

            {/* Year-over-year change */}
            <div className="flex items-center justify-between mt-4 px-1">
              <div>
                <div className="text-[10px] text-gray-mid font-medium">Overall Change</div>
                <div className={`text-lg font-bold font-mono ${yearChange > 0 ? 'text-coral' : 'text-amber'}`}>
                  {yearChange >= 0 ? '+' : ''}{yearPct.toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-mid font-medium">Median</div>
                <div className="text-lg font-bold font-mono text-ink-light">${current.median_price.toFixed(2)}</div>
              </div>
            </div>

            {/* Price distribution */}
            {current.price_distribution && (
              <div className="mt-4">
                <div className="text-[10px] text-gray-mid font-medium mb-2">Price Distribution</div>
                <DistributionBars distribution={current.price_distribution} />
              </div>
            )}

            {/* Mobile sparkline */}
            <div className="sm:hidden mt-4" onClick={e => e.stopPropagation()}>
              <div className="text-[10px] text-gray-mid mb-1">Price trend {'\u00B7'} tap to explore</div>
              <Sparkline data={sparkData} snapshots={snapshots} width={320} height={50} />
            </div>

            <p className="text-[10px] text-gray-mid mt-3 text-center flex items-center justify-center gap-1">
              <BarChart3 className="w-3 h-3 inline" /> Tracking Perth beer prices weekly. Click to collapse.
            </p>
          </div>
        )}

        {/* Collapse hint when not expanded */}
        {!expanded && (
          <p className="text-[10px] text-gray-mid mt-2 text-center">
            Click to see full breakdown {'\u00B7'} Cheapest suburb: {current.cheapest_suburb} (${current.cheapest_suburb_avg.toFixed(2)})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
