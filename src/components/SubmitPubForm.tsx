'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Beer, ScanLine, Trash2, Plus, Camera, ImagePlus } from 'lucide-react'
// heic2any is browser-only, dynamically imported in handleImageSelect

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
  initialPub?: { slug: string; name: string; suburb: string } | null;
}

type Mode = 'existing' | 'new' | 'report-outdated' | 'scan-menu';

interface ExtractedItem {
  beer_type: string;
  price: number;
  price_type: 'regular' | 'happy_hour';
}

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

export default function SubmitPubForm({ isOpen, onClose, userLocation, initialPub }: SubmitPubFormProps) {
  const [mode, setMode] = useState<Mode>('existing');
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [pubsLoading, setPubsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPub, setSelectedPub] = useState<Pub | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Form fields
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'regular' | 'happy_hour'>('regular');
  const [beerType, setBeerType] = useState('');
  const [pubName, setPubName] = useState('');
  const [suburb, setSuburb] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [outdatedNote, setOutdatedNote] = useState('');
  const [issueReason, setIssueReason] = useState<'price_wrong' | 'temp_closed' | 'perm_closed' | 'other'>('price_wrong');

  // Inline validation (P2b)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Scan menu state
  const [scanStep, setScanStep] = useState<'upload' | 'review' | 'submitting'>('upload');
  const [menuImages, setMenuImages] = useState<File[]>([]);
  const [menuPreviews, setMenuPreviews] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [scanError, setScanError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // Pre-select pub when initialPub is provided
  useEffect(() => {
    if (isOpen && initialPub && !selectedPub) {
      setSelectedPub({ slug: initialPub.slug, name: initialPub.name, suburb: initialPub.suburb });
      setSearch(initialPub.name);
    }
  }, [isOpen, initialPub, selectedPub]);

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
    if (userLocation && (mode === 'existing' || mode === 'report-outdated' || mode === 'scan-menu') && !search.trim()) {
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
    setPriceType('regular');
    setBeerType('');
    setPubName('');
    setSuburb('');
    setAddress('');
    setEmail('');
    setOutdatedNote('');
    setIssueReason('price_wrong');
    setError('');
    setFieldErrors({});
    setSubmitted(false);
    setShowDropdown(false);
    // Scan menu reset
    setScanStep('upload');
    setMenuImages([]);
    setMenuPreviews([]);
    setScanning(false);
    setExtractedItems([]);
    setScanError('');
    setScanProgress(0);
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
    if (mode === 'scan-menu') {
      if (scanStep === 'upload') return !!selectedPub && menuImages.length > 0;
      if (scanStep === 'review') return extractedItems.length > 0;
      return false;
    }
    return false;
  }, [mode, selectedPub, price, pubName, suburb, scanStep, menuImages, extractedItems]);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type - also allow HEIC/HEIF from iPhone/Android
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isHeic = fileType === 'image/heic' || fileType === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
    const isAccepted = ACCEPTED_TYPES.includes(fileType) || isHeic;

    if (!isAccepted) {
      setScanError('Please upload a JPEG, PNG, WebP, or HEIC image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setScanError('Image must be under 10MB.');
      return;
    }
    setScanError('');

    // Convert HEIC/HEIF to JPEG for API compatibility
    if (isHeic) {
      try {
        setScanError('Converting photo...');
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        const converted = new File(
          [blob as Blob],
          file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
          { type: 'image/jpeg' }
        );
        setMenuImages(prev => [...prev, converted]);
        setMenuPreviews(prev => [...prev, URL.createObjectURL(converted)]);
        setScanError('');
      } catch {
        setScanError('Could not convert this photo. Try taking a screenshot of the menu instead.');
      }
      // Reset input so same file can be re-selected
      e.target.value = '';
      return;
    }

    setMenuImages(prev => [...prev, file]);
    setMenuPreviews(prev => [...prev, URL.createObjectURL(file)]);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeMenuImage(index: number) {
    setMenuImages(prev => prev.filter((_, i) => i !== index));
    setMenuPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleScanMenu() {
    if (!selectedPub || menuImages.length === 0) return;
    setScanning(true);
    setScanError('');
    setScanProgress(0);

    const allItems: ExtractedItem[] = [];

    try {
      for (let i = 0; i < menuImages.length; i++) {
        setScanProgress(i + 1);
        const formData = new FormData();
        formData.append('image', menuImages[i]);
        formData.append('pub_slug', selectedPub.slug);

        const res = await fetch('/api/menu-scan', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) {
          setScanError(data.error || `Failed to scan photo ${i + 1}.`);
          setScanning(false);
          return;
        }

        if (data.items) {
          allItems.push(...data.items);
        }
      }

      setExtractedItems(allItems);
      setScanStep('review');
    } catch {
      setScanError('Network error. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  async function handleBulkSubmit() {
    if (!selectedPub || extractedItems.length === 0) return;
    setScanStep('submitting');
    setScanProgress(0);

    let successCount = 0;
    for (let i = 0; i < extractedItems.length; i++) {
      const item = extractedItems[i];
      try {
        const res = await fetch('/api/price-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pub_slug: selectedPub.slug,
            reported_price: item.price,
            beer_type: item.beer_type,
            price_type: item.price_type,
            notes: 'Submitted via menu scan',
          }),
        });
        if (res.ok) successCount++;
      } catch {
        // continue with remaining items
      }
      setScanProgress(i + 1);
    }

    if (successCount > 0) {
      setSubmitted(true);
    } else {
      setScanError('Failed to submit prices. You may have already reported for this pub recently.');
      setScanStep('review');
    }
  }

  function updateExtractedItem(index: number, field: keyof ExtractedItem, value: string | number) {
    setExtractedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  function removeExtractedItem(index: number) {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  }

  function addExtractedItem() {
    setExtractedItems(prev => [...prev, { beer_type: '', price: 0, price_type: 'regular' }]);
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
            price_type: priceType,
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
            notes: outdatedNote.trim()
              ? `[${issueReason}] ${outdatedNote.trim()}`
              : `[${issueReason}]`,
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
    'w-full px-3 py-3 h-11 bg-white border-2 border-gray-light rounded-card text-ink text-sm font-mono placeholder-gray-mid/50 focus:outline-none focus:border-ink transition-all';
  const inputErrorClass =
    'w-full px-3 py-3 h-11 bg-white border-2 border-red rounded-card text-ink text-sm font-mono placeholder-gray-mid/50 focus:outline-none focus:border-red transition-all';
  const labelClass =
    'block font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid mb-1.5';

  const modeTitle = mode === 'existing'
    ? 'Report a Price'
    : mode === 'new'
    ? 'Submit a New Pub'
    : mode === 'scan-menu'
    ? 'Scan a Menu'
    : 'Report an Issue';

  const modeSubtitle = mode === 'existing'
    ? 'Know a cheap pint? Let us know!'
    : mode === 'new'
    ? 'Add a pub we\'re missing'
    : mode === 'scan-menu'
    ? 'Upload a menu photo and we\'ll grab the prices'
    : 'Closed, renovating, or something else?';

  const submittedMessage = mode === 'existing'
    ? 'Price submitted! We\'ll review it shortly.'
    : mode === 'report-outdated'
    ? 'Thanks for the heads up! We\'ll look into it.'
    : mode === 'scan-menu'
    ? 'Prices submitted! We\'ll review them shortly.'
    : 'Pub submitted! We\'ll review and add it soon.';

  // Pub search widget (shared by 'existing' and 'report-outdated')
  const pubSearchWidget = (
    <div>
      <label className={labelClass} id="pub-search-label">Select a Pub</label>
      {selectedPub ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-off-white border-2 border-ink rounded-card">
          <span className="flex-1 text-sm font-mono font-bold text-ink">
            {selectedPub.name}
            <span className="text-gray-mid font-normal ml-1.5">
              - {selectedPub.suburb}
            </span>
          </span>
          <button
            type="button"
            onClick={handleDeselectPub}
            className="text-gray-mid hover:text-ink transition-colors p-0.5 rounded"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid/50"
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
              className="absolute z-50 mt-1 w-full bg-white border-3 border-ink rounded-card shadow-hard-sm max-h-56 overflow-y-auto"
            >
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-mid">
                  No pubs found for &ldquo;{search}&rdquo;
                </div>
              ) : (
                filtered.map((pub, i) => (
                  <button
                    key={pub.slug}
                    type="button"
                    onClick={() => handleSelectPub(pub)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-mono transition-colors border-b border-gray-light last:border-0 ${
                      i === highlightIndex
                        ? 'bg-off-white text-ink'
                        : 'text-ink hover:bg-off-white'
                    }`}
                  >
                    <span className="font-medium">{pub.name}</span>
                    <span className="text-gray-mid ml-1.5">
                      - {pub.suburb}
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
      className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[9999] flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-card max-w-lg w-full border-3 border-ink shadow-hard my-auto"
        role="dialog"
        aria-label={modeTitle}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-3 border-ink flex items-center justify-between">
          <div>
            <h2 className="font-mono font-extrabold text-lg text-ink">
              {modeTitle}
            </h2>
            <p className="text-xs text-gray-mid mt-0.5">
              {modeSubtitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-mid hover:text-ink transition-colors p-2 hover:bg-off-white rounded-card"
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
            <div className="w-12 h-12 mx-auto mb-4 rounded-card bg-green-pale border-2 border-green flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green"
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
            <h3 className="font-mono font-extrabold text-xl text-ink mb-2">
              Thanks legend! <Beer className="w-4 h-4 inline" />
            </h3>
            <p className="text-gray-mid text-sm">
              {submittedMessage}
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-8 py-2.5 font-mono text-sm font-bold uppercase tracking-[0.05em] text-ink border-3 border-ink rounded-pill shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-off-white rounded-card p-1 border-2 border-gray-light">
              {([
                { key: 'existing' as const, label: 'Report Price' },
                { key: 'report-outdated' as const, label: 'Report Issue' },
                { key: 'new' as const, label: 'New Pub' },
                { key: 'scan-menu' as const, label: 'Scan Menu', icon: true },
              ]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setMode(key); setError(''); setFieldErrors({}); setScanError(''); setScanStep('upload'); }}
                  aria-pressed={mode === key}
                  className={`flex-1 px-2 py-2 rounded-[8px] font-mono text-[0.7rem] font-bold transition-all flex items-center justify-center gap-1 ${
                    mode === key
                      ? 'bg-white text-ink border-2 border-ink shadow-sm'
                      : 'text-gray-mid hover:text-ink border-2 border-transparent'
                  }`}
                >
                  {icon && <ScanLine className="w-3 h-3" />}
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

                {/* Price Type Toggle */}
                <div>
                  <label className={labelClass}>Price Type</label>
                  <div className="flex gap-1 bg-off-white rounded-pill p-0.5 border-2 border-gray-light">
                    <button
                      type="button"
                      onClick={() => setPriceType('regular')}
                      className={`flex-1 px-3 py-1.5 rounded-pill font-mono text-[0.65rem] font-bold transition-all ${
                        priceType === 'regular'
                          ? 'bg-white text-ink shadow-sm'
                          : 'text-gray-mid hover:text-ink'
                      }`}
                    >
                      Regular Price
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceType('happy_hour')}
                      className={`flex-1 px-3 py-1.5 rounded-pill font-mono text-[0.65rem] font-bold transition-all ${
                        priceType === 'happy_hour'
                          ? 'bg-amber-pale text-amber shadow-sm'
                          : 'text-gray-mid hover:text-ink'
                      }`}
                    >
                      Happy Hour
                    </button>
                  </div>
                </div>
              </>
            ) : mode === 'scan-menu' ? (
              <>
                {scanStep === 'upload' && (
                  <>
                    {pubSearchWidget}

                    {/* Image upload zone */}
                    <div>
                      <label className={labelClass}>Menu Photo</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      {/* Uploaded image thumbnails */}
                      {menuPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {menuPreviews.map((preview, i) => (
                            <div key={i} className="relative">
                              <img
                                src={preview}
                                alt={`Menu photo ${i + 1}`}
                                className="w-full h-24 object-cover rounded-card border-3 border-ink"
                              />
                              <button
                                type="button"
                                onClick={() => removeMenuImage(i)}
                                className="absolute top-1 right-1 w-6 h-6 bg-white border-2 border-ink rounded-full flex items-center justify-center hover:bg-off-white transition-colors"
                                aria-label={`Remove photo ${i + 1}`}
                              >
                                <Trash2 className="w-3 h-3 text-ink" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload buttons — always visible */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="py-6 border-3 border-dashed border-gray-mid rounded-card flex flex-col items-center gap-2 hover:border-ink hover:bg-off-white transition-all cursor-pointer"
                        >
                          <Camera className="w-7 h-7 text-gray-mid" />
                          <span className="font-mono text-xs text-gray-mid font-bold">
                            {menuPreviews.length > 0 ? 'Add Photo' : 'Take Photo'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="py-6 border-3 border-dashed border-gray-mid rounded-card flex flex-col items-center gap-2 hover:border-ink hover:bg-off-white transition-all cursor-pointer"
                        >
                          <ImagePlus className="w-7 h-7 text-gray-mid" />
                          <span className="font-mono text-xs text-gray-mid font-bold">
                            Upload Photo
                          </span>
                        </button>
                        <p className="col-span-2 text-center font-mono text-[0.6rem] text-gray-mid -mt-1">
                          {menuPreviews.length > 0
                            ? `${menuPreviews.length} photo${menuPreviews.length !== 1 ? 's' : ''} added — add more or scan`
                            : 'Works with iPhone and Android photos'}
                        </p>
                      </div>
                    </div>

                    {scanError && (
                      <p className="text-sm text-red font-mono font-bold" role="alert">{scanError}</p>
                    )}
                  </>
                )}

                {scanStep === 'upload' && scanning && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-sm text-gray-mid font-bold">
                      Scanning {menuImages.length > 1 ? `photo ${scanProgress}/${menuImages.length}` : 'menu'}...
                    </span>
                  </div>
                )}

                {scanStep === 'review' && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid">
                        {extractedItems.length} item{extractedItems.length !== 1 ? 's' : ''} found
                      </span>
                      <span className="font-mono text-[0.6rem] text-gray-mid">
                        at {selectedPub?.name}
                      </span>
                    </div>

                    {extractedItems.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="font-mono text-sm text-gray-mid mb-2">No prices found in this image.</p>
                        <p className="font-mono text-xs text-gray-mid">Try a clearer photo, or use Report Price to add manually.</p>
                        <button
                          type="button"
                          onClick={() => { setScanStep('upload'); setMenuImages([]); setMenuPreviews([]); }}
                          className="mt-3 px-4 py-2 font-mono text-xs font-bold text-ink border-2 border-ink rounded-pill hover:bg-off-white transition-all"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {extractedItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 bg-off-white rounded-card border-2 border-gray-light">
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={item.beer_type}
                                onChange={(e) => updateExtractedItem(i, 'beer_type', e.target.value)}
                                placeholder="Beer name"
                                className="w-full bg-transparent text-sm font-mono text-ink focus:outline-none placeholder-gray-mid/50"
                              />
                            </div>
                            <div className="w-20 flex-shrink-0">
                              <input
                                type="number"
                                step="0.50"
                                min="3"
                                max="30"
                                value={item.price || ''}
                                onChange={(e) => updateExtractedItem(i, 'price', parseFloat(e.target.value) || 0)}
                                placeholder="$"
                                className="w-full bg-white text-sm font-mono text-ink text-right px-2 py-1 rounded border-2 border-gray-light focus:outline-none focus:border-ink"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => updateExtractedItem(i, 'price_type', item.price_type === 'regular' ? 'happy_hour' : 'regular')}
                              className={`flex-shrink-0 px-2 py-1 rounded-pill font-mono text-[0.55rem] font-bold border-2 transition-all ${
                                item.price_type === 'happy_hour'
                                  ? 'bg-amber-pale text-amber border-amber/30'
                                  : 'bg-white text-gray-mid border-gray-light'
                              }`}
                            >
                              {item.price_type === 'happy_hour' ? 'HH' : 'REG'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExtractedItem(i)}
                              className="flex-shrink-0 p-1 text-gray-mid hover:text-red transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {extractedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={addExtractedItem}
                        className="flex items-center gap-1 px-3 py-1.5 font-mono text-[0.65rem] font-bold text-gray-mid hover:text-ink transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Item
                      </button>
                    )}

                    {scanError && (
                      <p className="text-sm text-red font-mono font-bold" role="alert">{scanError}</p>
                    )}
                  </>
                )}

                {scanStep === 'submitting' && (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-sm text-gray-mid font-bold">
                      Submitting {scanProgress}/{extractedItems.length}...
                    </span>
                  </div>
                )}
              </>
            ) : mode === 'report-outdated' ? (
              <>
                {pubSearchWidget}

                {/* Issue reason pills */}
                <div>
                  <label className={labelClass}>What&apos;s the issue?</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { key: 'price_wrong' as const, label: 'Price Wrong' },
                      { key: 'temp_closed' as const, label: 'Temp Closed' },
                      { key: 'perm_closed' as const, label: 'Perm Closed' },
                      { key: 'other' as const, label: 'Other' },
                    ]).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIssueReason(key)}
                        className={`px-3 py-2 rounded-pill font-mono text-[0.65rem] font-bold transition-all border-2 ${
                          issueReason === key
                            ? 'bg-ink text-white border-ink shadow-sm'
                            : 'bg-off-white text-gray-mid border-gray-light hover:text-ink hover:border-ink/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional note */}
                <div>
                  <label className={labelClass}>Details (optional)</label>
                  <textarea
                    value={outdatedNote}
                    onChange={(e) => setOutdatedNote(e.target.value)}
                    placeholder={
                      issueReason === 'price_wrong' ? 'e.g. Price went up to $12'
                      : issueReason === 'temp_closed' ? 'e.g. Closed for renovations until March'
                      : issueReason === 'perm_closed' ? 'e.g. Shut down last month'
                      : 'What should we know?'
                    }
                    className="w-full px-3 py-3 bg-white border-2 border-gray-light rounded-card text-ink text-sm font-mono placeholder-gray-mid/50 focus:outline-none focus:border-ink transition-all min-h-[80px] resize-y"
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
              <p className="text-sm text-red font-mono font-bold" role="alert">{error}</p>
            )}

            {/* Submit button */}
            {mode === 'scan-menu' ? (
              scanStep === 'upload' ? (
                <button
                  type="button"
                  disabled={scanning || !selectedPub || menuImages.length === 0}
                  onClick={handleScanMenu}
                  className="w-full py-3 px-4 h-12 bg-ink text-white font-mono font-bold text-sm uppercase tracking-[0.05em] rounded-pill border-3 border-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard-sm flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4" />
                      Scan Menu
                    </>
                  )}
                </button>
              ) : scanStep === 'review' && extractedItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  className="w-full py-3 px-4 h-12 bg-ink text-white font-mono font-bold text-sm uppercase tracking-[0.05em] rounded-pill border-3 border-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all"
                >
                  Submit {extractedItems.length} Price{extractedItems.length !== 1 ? 's' : ''}
                </button>
              ) : null
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-3 px-4 h-12 bg-ink text-white font-mono font-bold text-sm uppercase tracking-[0.05em] rounded-pill border-3 border-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard-sm"
              >
                {isSubmitting
                  ? 'Submitting...'
                  : mode === 'existing'
                  ? 'Submit Price'
                  : mode === 'report-outdated'
                  ? 'Submit Report'
                  : 'Submit New Pub'}
              </button>
            )}

            <p className="text-[10px] text-gray-mid text-center font-mono">
              All submissions are reviewed before going live.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
