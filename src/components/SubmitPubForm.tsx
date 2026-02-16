'use client';

import { useState } from 'react';

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create mailto link with form data
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

    // Open email client
    window.location.href = `mailto:perthpintprices@gmail.com?subject=${subject}&body=${body}`;
    
    setIsSubmitting(false);
    setSubmitted(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
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
      onClose();
    }, 3000);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🍺 Submit a Pub</h2>
            <p className="text-sm text-zinc-400">Know a cheap pint spot? Let us know!</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Thanks legend!</h3>
            <p className="text-zinc-400">Your email client should open with the submission details. Just hit send!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Required Fields */}
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

            <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className={labelClass}>Beer Type</label>
              <input
                type="text"
                value={formData.beerType}
                onChange={(e) => setFormData({ ...formData, beerType: e.target.value })}
                placeholder="e.g. Hahn SuperDry, House Lager"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Happy Hour Details</label>
              <input
                type="text"
                value={formData.happyHour}
                onChange={(e) => setFormData({ ...formData, happyHour: e.target.value })}
                placeholder="e.g. Mon-Fri 4-6pm"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
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

            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anything else we should know?"
                rows={2}
                className={inputClass}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? 'Opening email...' : '📧 Submit via Email'}
            </button>

            <p className="text-xs text-zinc-500 text-center">
              This will open your email client. We review all submissions manually.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
