'use client';

import { useState, useEffect, useRef } from 'react';

interface SubmitPubFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitPubForm({ isOpen, onClose }: SubmitPubFormProps) {
  const [formData, setFormData] = useState({
    pubName: '',
    address: '',
    suburb: '',
    price: '',
    beerType: '',
    happyHour: '',
    website: '',
    submitterEmail: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subject = encodeURIComponent(`New Pub Submission: ${formData.pubName}`);
    const body = encodeURIComponent(`
NEW PUB SUBMISSION
==================

Pub Name: ${formData.pubName}
Address: ${formData.address}
Suburb: ${formData.suburb}
Pint Price: $${formData.price}
Beer Type: ${formData.beerType || 'Not specified'}
Happy Hour: ${formData.happyHour || 'Not specified'}
Website: ${formData.website || 'Not specified'}

Submitted by: ${formData.submitterEmail || 'Anonymous'}
Notes: ${formData.notes || 'None'}
    `.trim());

    window.location.href = `mailto:perthpintprices@gmail.com?subject=${subject}&body=${body}`;
    
    setIsSubmitting(false);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        pubName: '', address: '', suburb: '', price: '',
        beerType: '', happyHour: '', website: '', submitterEmail: '', notes: ''
      });
      onClose();
    }, 3000);
  };

  // Click outside to close
  function handleOverlayClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  const inputClass = "w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1";

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div ref={modalRef} className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-800">Submit a Price</h2>
            <p className="text-xs text-stone-400 mt-0.5">Know a cheap pint spot? Let us know!</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors p-2 hover:bg-stone-100 rounded-xl"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">Thanks legend!</h3>
            <p className="text-stone-500 text-sm">Your email client should open with the submission details. Just hit send!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-3">
            <div>
              <label className={labelClass}>Pub Name *</label>
              <input
                type="text"
                required
                value={formData.pubName}
                onChange={(e) => setFormData({ ...formData, pubName: e.target.value })}
                placeholder="e.g. The Lucky Shag"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Suburb *</label>
                <input
                  type="text"
                  required
                  value={formData.suburb}
                  onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
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
                  max="20"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 8.00"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 123 James St"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Beer Type</label>
                <input
                  type="text"
                  value={formData.beerType}
                  onChange={(e) => setFormData({ ...formData, beerType: e.target.value })}
                  placeholder="e.g. Hahn SuperDry"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Happy Hour</label>
                <input
                  type="text"
                  value={formData.happyHour}
                  onChange={(e) => setFormData({ ...formData, happyHour: e.target.value })}
                  placeholder="e.g. Mon-Fri 4-6pm"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Your Email (optional)</label>
              <input
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                placeholder="For follow-up questions"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
            >
              {isSubmitting ? 'Opening email...' : 'Submit via Email'}
            </button>

            <p className="text-[10px] text-stone-400 text-center">
              This opens your email client. We review all submissions manually.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
