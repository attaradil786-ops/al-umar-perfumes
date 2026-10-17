'use client';

import React, { useEffect, useState } from 'react';

interface Offer {
  id: string;
  title: string;
  description: string;
  code?: string | null;
  bannerImage?: string | null;
  placement: string; // top_bar, hero, popup
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
  position: number;
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [placement, setPlacement] = useState('top_bar');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [position, setPosition] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchOffers = () => {
    setLoading(true);
    fetch('/api/admin/offers')
      .then(r => r.json())
      .then(res => {
        if (res.success) setOffers(res.offers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCode('');
    setBannerImage('');
    setPlacement('top_bar');
    setStartsAt(new Date().toISOString().slice(0, 16));
    setEndsAt('');
    setPosition('0');
    setIsActive(true);
    setErrorMsg('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingOffer(null);
    setShowModal(true);
  };

  const handleOpenEdit = (off: Offer) => {
    setEditingOffer(off);
    setTitle(off.title);
    setDescription(off.description);
    setCode(off.code || '');
    setBannerImage(off.bannerImage || '');
    setPlacement(off.placement || 'top_bar');
    setStartsAt(off.startsAt ? new Date(off.startsAt).toISOString().slice(0, 16) : '');
    setEndsAt(off.endsAt ? new Date(off.endsAt).toISOString().slice(0, 16) : '');
    setPosition(String(off.position || 0));
    setIsActive(off.isActive);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        title,
        description,
        code: code.trim() ? code.trim().toUpperCase() : null,
        bannerImage: bannerImage.trim() || null,
        placement,
        startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        position: Number(position) || 0,
        isActive,
      };

      if (editingOffer) {
        const res = await fetch(`/api/admin/offers/${editingOffer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Offer "${json.offer.title}" updated!`);
          setShowModal(false);
          setEditingOffer(null);
          fetchOffers();
        } else {
          setErrorMsg(json.error || 'Failed to update offer');
        }
      } else {
        const res = await fetch('/api/admin/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Offer "${json.offer.title}" published!`);
          setShowModal(false);
          resetForm();
          fetchOffers();
        } else {
          setErrorMsg(json.error || 'Failed to create offer');
        }
      }
    } catch {
      setErrorMsg('Network error while saving offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean, titleStr: string) => {
    try {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setOffers(prev =>
          prev.map(o => (o.id === id ? { ...o, isActive: !currentActive } : o))
        );
        showToast(`Offer "${titleStr}" ${!currentActive ? 'activated' : 'deactivated'}`);
      }
    } catch {
      alert('Failed to update offer state');
    }
  };

  const handleDelete = async (id: string, titleStr: string) => {
    if (!confirm(`Are you sure you want to permanently delete offer "${titleStr}"?`)) return;
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setOffers(prev => prev.filter(o => o.id !== id));
        showToast(`Offer "${titleStr}" deleted`);
      }
    } catch {
      alert('Failed to delete offer');
    }
  };

  const getPlacementBadge = (pl: string) => {
    switch (pl) {
      case 'top_bar':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'hero':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'popup':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1E6B5C] text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">
            Site-Wide Offers & Seasonal Promotions
          </h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Publish dynamic banners to the top announcement bar, homepage hero banner, or session popup modal
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <span>+</span>
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8DCC8] bg-[#FFF8EC]/70 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37]">
                <th className="py-3.5 px-4">Placement</th>
                <th className="py-3.5 px-4">Offer Title & Details</th>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Schedule (Starts / Ends)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-[#7A5B37] animate-pulse">
                    Loading promotional campaigns...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-[#7A5B37]">
                    No promotional offers created. Click &quot;Create New Offer&quot; to configure banners.
                  </td>
                </tr>
              ) : (
                offers.map(offer => {
                  const now = new Date();
                  const isStarted = new Date(offer.startsAt) <= now;
                  const isEnded = offer.endsAt && new Date(offer.endsAt) < now;

                  return (
                    <tr
                      key={offer.id}
                      className={`hover:bg-[#FFF8EC]/40 transition ${
                        !offer.isActive || isEnded ? 'opacity-60 bg-gray-50/50' : ''
                      }`}
                    >
                      {/* Placement */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPlacementBadge(
                            offer.placement
                          )}`}
                        >
                          {offer.placement.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Title & Desc */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-sm text-[#121212]">{offer.title}</div>
                        <div className="text-xs text-[#7A5B37] line-clamp-1">{offer.description}</div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4">
                        {offer.code ? (
                          <span className="font-mono text-xs font-bold text-[#1E6B5C] bg-[#1E6B5C]/10 px-2 py-0.5 rounded">
                            {offer.code}
                          </span>
                        ) : (
                          <span className="text-xs text-[#7A5B37]">None</span>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-[#121212] font-medium">
                          From: {new Date(offer.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[#7A5B37]">
                          Until: {offer.endsAt ? new Date(offer.endsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Indefinite'}
                        </div>
                        {isEnded ? (
                          <span className="text-[10px] font-bold text-rose-600 block">Ended</span>
                        ) : !isStarted ? (
                          <span className="text-[10px] font-bold text-amber-600 block">Scheduled</span>
                        ) : null}
                      </td>

                      {/* Active toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(offer.id, offer.isActive, offer.title)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition ${
                            offer.isActive
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(offer)}
                          className="text-xs font-bold text-[#1E6B5C] hover:underline px-2 py-1 rounded hover:bg-[#1E6B5C]/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(offer.id, offer.title)}
                          className="text-xs font-bold text-[#BA3D3D] hover:underline px-2 py-1 rounded hover:bg-[#BA3D3D]/10"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Offer */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#553E23]">
                {editingOffer ? 'Edit Promotional Offer' : 'Create Site-Wide Offer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#7A5B37] hover:text-[#121212] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveOffer} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Offer Placement *
                </label>
                <select
                  value={placement}
                  onChange={e => setPlacement(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-bold text-[#553E23] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                >
                  <option value="top_bar">Top Announcement Bar (Replaces top bar text)</option>
                  <option value="hero">Homepage Hero Banner (Floating badge/overlay)</option>
                  <option value="popup">Session Popup Modal (Shown once per customer session)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Offer Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Eid Ul-Fitr Collection Launch"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-bold text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Description / Subtitle *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Enjoy complimentary shipping & 20% off all artisanal attars using code EID20"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EID20"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 font-mono text-xs font-bold text-[#1E6B5C] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Banner / Graphic URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /images/..."
                    value={bannerImage}
                    onChange={e => setBannerImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Ends At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={e => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#1E6B5C] rounded border-[#E8DCC8]"
                  />
                  <span className="text-xs font-bold text-[#553E23]">Active Immediately</span>
                </label>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#7A5B37] font-semibold">Priority:</span>
                  <input
                    type="number"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-[#E8DCC8] text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DCC8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DCC8] text-xs font-bold text-[#7A5B37] hover:bg-[#FFF8EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
