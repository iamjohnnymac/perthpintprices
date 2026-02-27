'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface Pub {
  slug: string;
  name: string;
  suburb: string;
}

interface SubmitPubFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'existing' | 'new';

export default function SubmitPubForm({ isOpen, onClose }: SubmitPubFormProps) {
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

  // Filter pubs
  const filtered = useMemo(() => {
    if (!search.trim()) return pubs.slice(0, 50);
    const q = search.toLowerCase();
    return pubs
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.suburb.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [search, pubs]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered]);

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
    setError('');
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
          setError('Please enter a price.');
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
      } else {
        if (!pubName.trim() || !suburb.trim() || !price) {
          setError('Pub name, suburb, and price are required.');
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
    'w-full px-3 py-3 h-11 bg-cream border border-cream-dark rounded-xl text-charcoal placeholder-stone-warm/50 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-all text-sm';
  const labelClass =
    'block text-xs font-semibold text-stone-warm uppercase tracking-wide mb-1.5';

  return (
    <div
      className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[9999] flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-lg w-full border border-cream-dark shadow-2xl my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-dark flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">
              {mode === 'existing' ? 'Report a Price' : 'Submit a New Pub'}
            </h2>
            <p className="text-xs text-stone-warm mt-0.5">
              {mode === 'existing'
                ? 'Know a cheap pint? Let us know!'
                : 'Add a pub we\'re missing'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-warm hover:text-charcoal transition-colors p-2 hover:bg-cream rounded-xl"
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
            <p className="text-stone-warm text-sm">
              {mode === 'existing'
                ? 'Price submitted! We\'ll review it shortly.'
                : 'Pub submitted! We\'ll review and add it soon.'}
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 text-sm font-semibold text-amber hover:text-amber-dark transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'existing' ? (
              <>
                {/* Pub search / selection */}
                <div>
                  <label className={labelClass}>Select a Pub</label>
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
                        className="text-stone-warm hover:text-charcoal transition-colors p-0.5"
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

                {/* Price + Beer Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Pint Price ($) *</label>
                    <input
                      type="number"
                      required
                      step="0.50"
                      min="1"
                      max="30"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 8.00"
                      className={inputClass}
                    />
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

                {/* Switch to new mode */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('new');
                      setError('');
                    }}
                    className="text-sm text-amber hover:text-amber-dark font-medium transition-colors"
                  >
                    My pub isn&apos;t listed →
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Back link */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('existing');
                    setError('');
                  }}
                  className="text-sm text-amber hover:text-amber-dark font-medium transition-colors mb-1"
                >
                  ← Back to pub search
                </button>

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
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Pint Price ($) *</label>
                    <input
                      type="number"
                      required
                      step="0.50"
                      min="1"
                      max="30"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 8.00"
                      className={inputClass}
                    />
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
              <p className="text-sm text-pricey font-medium">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 h-12 bg-amber hover:bg-amber-dark text-white font-bold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting
                ? 'Submitting...'
                : mode === 'existing'
                ? 'Submit Price'
                : 'Submit New Pub'}
            </button>

            <p className="text-[10px] text-stone-warm text-center">
              All submissions are reviewed before going live.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
