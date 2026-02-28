'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface Pub {
  slug: string;
  name: string;
  suburb: string;
  lat?: number;
  lng?: number;
}

interface SubmitPubFormProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

type Mode = 'existing' | 'new' | 'report-outdated';

function getDistanceKmSimple(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SubmitPubForm({ isOpen, onClose, userLocation }: SubmitPubFormProps) {
  const [mode, setMode] = useState<Mode>('existing');
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [pubsLoading, setPubsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Form fields
  const [price, setPrice] = useState('');
  const [beerType, setBeerType] = useState('');
  const [pubName, setPubName] = useState('');
  const [suburb, setSuburb] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [outdatedNote, setOutdatedNote] = useState('');

  // Inline validation (P2b)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch pubs on open
  useEffect(() => {
    if (!isOpen) return;
    setPubsLoading(true);
    fetch('/api/pubs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPubs(data);
      })
      .catch(() => {})
      .finally(() => setPubsLoading(false));
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Filter and sort pubs (P2b: sort by distance when location available + mode is existing/report-outdated)
  const filtered = useMemo(() => {
    let list: Pub[];
    if (!search.trim()) {
      list = pubs.slice(0, 50);
    } else {
      const q = search.toLowerCase();
      list = pubs
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.suburb.toLowerCase().includes(q)
        )
        .slice(0, 30);
    }

    // Sort by distance when user location is available and in existing/report-outdated mode
    if (userLocation && (mode === 'existing' || mode === 'report-outdated') && !search.trim()) {
      list = [...list].sort((a, b) => {
        if (!a.lat || !a.lng) return 1;
        if (!b.lat || !b.lng) return -1;
        const distA = getDistanceKmSimple(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = getDistanceKmSimple(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    }

    return list;
  }, [search, pubs, userLocation, mode]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered]);

  // P2b: Price validation
  function validatePrice(val: string): string {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < 3) return 'Price must be at least $3';
    if (num > 30) return 'Price must be $30 or less';
    return '';
  }

  function handlePriceChange(val: string) {
    setPrice(val);
    const err = validatePrice(val);
    setFieldErrors((prev) => ({ ...prev, price: err }));
  }

  function resetForm() {
    setMode('existing');
    setSearch('');
    setSelectedPub(null);
    setPrice('');
    setBeerType('');
    setPubName('');
    setSuburb('');
    setAddress('');
    setEmail('');
    setOutdatedNote('');
    setError('');
    setFieldErrors({});
    setSubmitted(false);
    setShowDropdown(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSelectPub(pub: Pub) {
    setSelectedPub(pub);
    setSearch('');
    setShowDropdown(false);
    setError('');
  }

  function handleDeselectPub() {
    setSelectedPub(null);
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelectPub(filtered[highlightIndex]);
    }
  }

  // P2b: Check if form is valid for submit button disabling
  const isFormValid = useMemo(() => {
    if (mode === 'existing') {
      if (!selectedPub) return false;
      if (!price) return false;
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 3 || priceNum > 30) return false;
      return true;
    }
    if (mode === 'new') {
      if (!pubName.trim() || !suburb.trim() || !price) return false;
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 3 || priceNum > 30) return false;
      return true;
    }
    if (mode === 'report-outdated') {
      return !!selectedPub;
    }
    return false;
  }, [mode, selectedPub, price, pubName, suburb]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'existing') {
        if (!selectedPub) {
          setError('Please select a pub first.');
          setIsSubmitting(false);
          return;
        }
        if (!price) {
          setFieldErrors((prev) => ({ ...prev, price: 'Please enter a price.' }));
          setIsSubmitting(false);
          return;
        }
        const priceErr = validatePrice(price);
        if (priceErr) {
          setFieldErrors((prev) => ({ ...prev, price: priceErr }));
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/price-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pub_slug: selectedPub.slug,
            reported_price: parseFloat(price),
            beer_type: beerType || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong.');
          setIsSubmitting(false);
          return;
        }
      } else if (mode === 'report-outdated') {
        if (!selectedPub) {
          setError('Please select a pub first.');
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/price-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pub_slug: selectedPub.slug,
            outdated: true,
            note: outdatedNote.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong.');
          setIsSubmitting(false);
          return;
        }
      } else {
        if (!pubName.trim() || !suburb.trim() || !price) {
          setError('Pub name, suburb, and price are required.');
          setIsSubmitting(false);
          return;
        }
        const priceErr = validatePrice(price);
        if (priceErr) {
          setFieldErrors((prev) => ({ ...prev, price: priceErr }));
          setIsSubmitting(false);
          return;
        }

        const res = await fetch('/api/pub-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pub_name: pubName.trim(),
            suburb: suburb.trim(),
            address: address.trim() || undefined,
            price: parseFloat(price),
            beer_type: beerType || undefined,
            submitter_email: email.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong.');
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-3 h-11 bg-cream border border-cream-dark rounded-xl text-charcoal placeholder-stone-warm/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 focus:border-amber transition-all text-sm';
  const inputErrorClass =
    'w-full px-3 py-3 h-11 bg-cream border border-red-400 rounded-xl text-charcoal placeholder-stone-warm/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-1 focus:border-red-400 transition-all text-sm';
  const labelClass =
    'block text-sm font-medium text-stone-600 mb-1.5';

  const modeTitle = mode === 'existing'
    ? 'Report a Price'
    : mode === 'new'
    ? 'Submit a New Pub'
    : 'Report Outdated Price';

  const modeSubtitle = mode === 'existing'
    ? 'Know a cheap pint? Let us know!'
    : mode === 'new'
    ? 'Add a pub we\'re missing'
    : 'Let us know if a price has changed';

  const submittedMessage = mode === 'existing'
    ? 'Price submitted! We\'ll review it shortly.'
    : mode === 'report-outdated'
    ? 'Thanks for the heads up! We\'ll check this price.'
    : 'Pub submitted! We\'ll review and add it soon.';

  // Pub search widget (shared by 'existing' and 'report-outdated')
  const pubSearchWidget = (
    <div>
      <label className={labelClass} id="pub-search-label">Select a Pub</label>
      {selectedPub ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber/10 border border-amber/20 rounded-xl">
          <span className="flex-1 text-sm font-medium text-charcoal">
            {selectedPub.name}
            <span className="text-stone-warm font-normal ml-1.5">
              — {selectedPub.suburb}
            </span>
          </span>
          <button
            type="button"
            onClick={handleDeselectPub}
            className="text-stone-warm hover:text-charcoal transition-colors p-0.5 focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded"
            aria-label="Deselect pub"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              pubsLoading
                ? 'Loading pubs...'
                : 'Search pubs by name or suburb...'
            }
            className={inputClass}
            autoComplete="off"
            aria-required="true"
            aria-labelledby="pub-search-label"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-warm/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {showDropdown && !pubsLoading && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-1 w-full bg-white border border-cream-dark rounded-xl shadow-lg max-h-56 overflow-y-auto"
            >
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-stone-warm">
                  No pubs found for &ldquo;{search}&rdquo;
                </div>
              ) : (
                filtered.map((pub, i) => (
                  <button
                    key={pub.slug}
                    type="button"
                    onClick={() => handleSelectPub(pub)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      i === highlightIndex
                        ? 'bg-amber/10 text-charcoal'
                        : 'text-charcoal hover:bg-cream'
                    } ${i === 0 ? 'rounded-t-xl' : ''} ${
                      i === filtered.length - 1
                        ? 'rounded-b-xl'
                        : ''
                    }`}
                  >
                    <span className="font-medium">{pub.name}</span>
                    <span className="text-stone-warm ml-1.5">
                      — {pub.suburb}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[9999] flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-lg w-full border border-cream-dark shadow-2xl my-auto"
        role="dialog"
        aria-label={modeTitle}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-dark flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">
              {modeTitle}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {modeSubtitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-warm hover:text-charcoal transition-colors p-2 hover:bg-cream rounded-xl focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-amber"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-charcoal mb-2">
              Thanks legend! 🍻
            </h3>
            <p className="text-stone-500 text-sm">
              {submittedMessage}
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 text-sm font-semibold text-amber hover:text-amber-dark transition-colors focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-cream rounded-lg p-1">
              {([
                { key: 'existing' as const, label: 'Report Price' },
                { key: 'report-outdated' as const, label: 'Flag Outdated' },
                { key: 'new' as const, label: 'New Pub' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setMode(key); setError(''); setFieldErrors({}); }}
                  aria-pressed={mode === key}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 ${
                    mode === key
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-stone-warm hover:text-charcoal'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'existing' ? (
              <>
                {pubSearchWidget}

                {/* Price + Beer Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Pint Price ($) *</label>
                    <input
                      type="number"
                      required
                      step="0.50"
                      min="3"
                      max="30"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="e.g. 8.00"
                      className={fieldErrors.price ? inputErrorClass : inputClass}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.price}
                    />
                    {fieldErrors.price && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Beer Type</label>
                    <input
                      type="text"
                      value={beerType}
                      onChange={(e) => setBeerType(e.target.value)}
                      placeholder="e.g. Hahn SuperDry"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            ) : mode === 'report-outdated' ? (
              <>
                {pubSearchWidget}

                {/* Optional note */}
                <div>
                  <label className={labelClass}>What&apos;s wrong? (optional)</label>
                  <textarea
                    value={outdatedNote}
                    onChange={(e) => setOutdatedNote(e.target.value)}
                    placeholder="e.g. Price went up to $12, closed down, etc."
                    className="w-full px-3 py-3 bg-cream border border-cream-dark rounded-xl text-charcoal placeholder-stone-warm/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1 focus:border-amber transition-all text-sm min-h-[80px] resize-y"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Pub name */}
                <div>
                  <label className={labelClass}>Pub Name *</label>
                  <input
                    type="text"
                    required
                    value={pubName}
                    onChange={(e) => setPubName(e.target.value)}
                    placeholder="e.g. The Lucky Shag"
                    className={inputClass}
                    aria-required="true"
                  />
                </div>

                {/* Suburb + Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Suburb *</label>
                    <input
                      type="text"
                      required
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                      placeholder="e.g. Northbridge"
                      className={inputClass}
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Pint Price ($) *</label>
                    <input
                      type="number"
                      required
                      step="0.50"
                      min="3"
                      max="30"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="e.g. 8.00"
                      className={fieldErrors.price ? inputErrorClass : inputClass}
                      aria-required="true"
                      aria-invalid={!!fieldErrors.price}
                    />
                    {fieldErrors.price && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.price}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 James St"
                    className={inputClass}
                  />
                </div>

                {/* Beer Type */}
                <div>
                  <label className={labelClass}>Beer Type</label>
                  <input
                    type="text"
                    value={beerType}
                    onChange={(e) => setBeerType(e.target.value)}
                    placeholder="e.g. Hahn SuperDry"
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Your Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="For follow-up questions"
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-pricey font-medium" role="alert">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full py-3 px-4 h-12 bg-amber hover:bg-amber-dark text-white font-bold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-1"
            >
              {isSubmitting
                ? 'Submitting...'
                : mode === 'existing'
                ? 'Submit Price'
                : mode === 'report-outdated'
                ? 'Report Outdated'
                : 'Submit New Pub'}
            </button>

            <p className="text-[10px] text-stone-500 text-center">
              All submissions are reviewed before going live.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
