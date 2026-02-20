'use client'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import InfoTooltip from './InfoTooltip'

// ── Tax constants (ATO rates as of Feb 2026) ──────────────────────
const DRAUGHT_EXCISE_PER_LAL = 43.39  // $/litre of alcohol — FROZEN until Aug 2027
const PINT_LITRES = 0.568             // 568ml
const DEFAULT_ABV = 0.048             // 4.8% typical full-strength
const EXCISE_THRESHOLD = 0.0115       // 1.15% free threshold
const GST_RATE = 0.10

// Country excise comparison (approximate AUD per pint equivalent)
const COUNTRIES = [
  { name: 'Australia', flag: '\ud83c\udde6\ud83c\uddfa', excise: 0, color: '#d97706' },
  { name: 'UK', flag: '\ud83c\uddec\ud83c\udde7', excise: 0.32, color: '#6b7280' },
  { name: 'USA', flag: '\ud83c\uddfa\ud83c\uddf8', excise: 0.11, color: '#6b7280' },
  { name: 'Japan', flag: '\ud83c\uddef\ud83c\uddf5', excise: 0.38, color: '#6b7280' },
  { name: 'Germany', flag: '\ud83c\udde9\ud83c\uddea', excise: 0.04, color: '#6b7280' },
]

function calcTax(price: number) {
  const effectiveAbv = DEFAULT_ABV - EXCISE_THRESHOLD
  const alcoholLitres = PINT_LITRES * effectiveAbv
  const excise = alcoholLitres * DRAUGHT_EXCISE_PER_LAL
  const gst = price / 11  // GST is 1/11th of GST-inclusive price
  const totalTax = excise + gst
  const pubGets = price - totalTax
  return { excise, gst, totalTax, pubGets, taxPercent: (totalTax / price) * 100 }
}

export default function TaxmansTake({ pubs }: { pubs: Pub[] }) {
  const [showDetails, setShowDetails] = useState(false)

  const stats = useMemo(() => {
    const prices = pubs.filter(p => p.price !== null && p.price > 0).map(p => p.price as number)
    if (prices.length === 0) return null
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const cheapest = Math.min(...prices)
    const dearest = Math.max(...prices)

    const avgTax = calcTax(avg)
    const cheapTax = calcTax(cheapest)
    const dearTax = calcTax(dearest)

    const ausExcise = avgTax.excise
    const annualPintsPerPerson = 52 * 2
    const annualTaxPerPerson = annualPintsPerPerson * avgTax.totalTax
    const germanyDiff = ausExcise - 0.04
    const priceSavingIfGerman = germanyDiff + (germanyDiff * GST_RATE)
    const multiplierVsGermany = Math.round(ausExcise / 0.04)

    return {
      avg: avg.toFixed(2),
      cheapest: cheapest.toFixed(2),
      dearest: dearest.toFixed(2),
      avgTax,
      cheapTax,
      dearTax,
      ausExcise,
      annualTaxPerPerson: annualTaxPerPerson.toFixed(0),
      priceSavingIfGerman: priceSavingIfGerman.toFixed(2),
      multiplierVsGermany,
    }
  }, [pubs])

  if (!stats) return null

  const countries = COUNTRIES.map(c =>
    c.name === 'Australia' ? { ...c, excise: stats.ausExcise } : c
  )
  const maxExcise = Math.max(...countries.map(c => c.excise))

  return (
    <div className="bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-50 border border-stone-200/60 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" fill="white" opacity="0.9"/>
              <text x="8" y="10.5" textAnchor="middle" fill="#991b1b" fontSize="6" fontWeight="bold">$</text>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-1.5 uppercase tracking-wider">
              THE TAXMAN&apos;S TAKE
              <InfoTooltip text="Real excise + GST breakdown using ATO rates (Feb 2026). Draught beer excise is $43.39/LAL, frozen until Aug 2027. GST is 10% of sale price. Calculated for 4.8% ABV full-strength draught in a 568ml pint." />
            </h3>
            <p className="text-xs text-stone-500">Where your hard-earned $ actually goes</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold text-red-700">ATO RATES</span>
        </div>
      </div>

      {/* ── THE RECEIPT ── */}
      <div className="bg-white border border-dashed border-stone-300 rounded-lg p-3 mb-3 font-mono text-xs">
        <div className="text-center mb-2 pb-2 border-b border-dashed border-stone-200">
          <p className="font-bold text-stone-700 text-sm">PERTH PINT RECEIPT</p>
          <p className="text-stone-400 text-[10px]">AVG PRICE: ${stats.avg}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-stone-500">The pub&apos;s cut</span>
            <span className="text-stone-800 font-semibold">${stats.avgTax.pubGets.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Beer excise (ATO)</span>
            <span className="text-red-600 font-semibold">${stats.avgTax.excise.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">GST (10%)</span>
            <span className="text-red-600 font-semibold">${stats.avgTax.gst.toFixed(2)}</span>
          </div>
          <div className="border-t border-dashed border-stone-200 pt-1.5 flex justify-between font-bold">
            <span className="text-stone-700">GOVT&apos;S TOTAL TAKE</span>
            <span className="text-red-700">${stats.avgTax.totalTax.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-stone-400">Tax share of your pint</span>
            <span className="text-red-600 font-bold">{stats.avgTax.taxPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000"
              style={{ width: `${stats.avgTax.taxPercent}%` }}
            />
          </div>
        </div>

        <div className="text-center mt-2 pt-2 border-t border-dashed border-stone-200">
          <p className="text-stone-400 text-[10px]">* Based on 4.8% ABV full-strength draught {"\u00B7"} 568ml pint</p>
        </div>
      </div>

      {/* ── VIRAL STAT ── */}
      <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-lg p-3 mb-3 text-center">
        <p className="text-2xl font-black text-red-700 mb-0.5">{stats.multiplierVsGermany}x</p>
        <p className="text-xs text-stone-600">more beer tax than a German pays</p>
        <p className="text-[10px] text-stone-400 mt-1">
          If we taxed beer like Germany, you&apos;d save <span className="font-bold text-stone-600">${stats.priceSavingIfGerman}</span> per pint
        </p>
      </div>

      {/* ── COUNTRY COMPARISON ── */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Excise tax per pint by country</p>
        <div className="space-y-1.5">
          {countries.map(country => (
            <div key={country.name} className="flex items-center gap-2">
              <span className="text-sm w-5 text-center">{country.flag}</span>
              <span className="text-[11px] text-stone-600 w-16 flex-shrink-0">{country.name}</span>
              <div className="flex-1 h-4 bg-stone-100 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-700"
                  style={{
                    width: `${(country.excise / maxExcise) * 100}%`,
                    backgroundColor: country.color,
                    minWidth: country.excise > 0 ? '4px' : '0px'
                  }}
                />
              </div>
              <span className={`text-[11px] font-semibold w-10 text-right ${country.name === 'Australia' ? 'text-amber-700' : 'text-stone-500'}`}>
                ${country.excise.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── EXPAND DETAILS ── */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
      >
        {showDetails ? 'Less detail' : 'See the full damage'}
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {showDetails && (
        <div className="mt-2 space-y-3">
          {/* Price range tax comparison */}
          <div className="bg-white border border-stone-200 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Tax by price point</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-stone-400">Cheapest (${stats.cheapest})</p>
                <p className="text-sm font-bold text-red-600">${stats.cheapTax.totalTax.toFixed(2)}</p>
                <p className="text-[10px] text-stone-400">{stats.cheapTax.taxPercent.toFixed(1)}% of price</p>
              </div>
              <div className="border-x border-stone-100">
                <p className="text-[10px] text-stone-400">Average (${stats.avg})</p>
                <p className="text-sm font-bold text-red-600">${stats.avgTax.totalTax.toFixed(2)}</p>
                <p className="text-[10px] text-stone-400">{stats.avgTax.taxPercent.toFixed(1)}% of price</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">Dearest (${stats.dearest})</p>
                <p className="text-sm font-bold text-red-600">${stats.dearTax.totalTax.toFixed(2)}</p>
                <p className="text-[10px] text-stone-400">{stats.dearTax.taxPercent.toFixed(1)}% of price</p>
              </div>
            </div>
            <p className="text-[10px] text-stone-400 text-center mt-2 italic">
              Cheaper pints = higher tax % (excise is flat, not percentage-based)
            </p>
          </div>

          {/* Fun facts */}
          <div className="bg-white border border-stone-200 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Fun facts</p>
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <p>At 2 pints a week, you hand the government <span className="font-bold text-red-700">${stats.annualTaxPerPerson}</span> a year in beer tax alone</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <p>Australia&apos;s beer excise has been raised <span className="font-bold text-red-700">85+ times</span> since the automatic indexation system began</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <p>The excise alone (${stats.avgTax.excise.toFixed(2)}) costs more than an <span className="font-bold">entire pint in some countries</span></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <p>Good news: draught beer excise is <span className="font-bold text-emerald-700">frozen until Aug 2027</span> {"\u2014"} enjoy it while it lasts</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-stone-400 text-center">
            Source: ATO Excise Duty Rates (Feb 2026) {"\u00B7"} Draught beer tariff 1.11 {"\u00B7"} Rates frozen under Excise Tariff Proposal No. 1 2025
          </p>
        </div>
      )}
    </div>
  )
}
