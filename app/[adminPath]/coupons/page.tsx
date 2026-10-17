'use client';

import React, { useEffect, useState } from 'react';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENTAGE'); // PERCENTAGE, FLAT, FREE_SHIPPING
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchCoupons = () => {
    setLoading(true);
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(res => {
        if (res.success) setCoupons(res.coupons);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setCode('');
    setType('PERCENTAGE');
    setValue('');
    setMinOrder('0');
    setMaxUses('');
    setExpiresAt('');
    setIsActive(true);
    setErrorMsg('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(String(c.value));
    setMinOrder(String(c.minOrder || 0));
    setMaxUses(c.maxUses ? String(c.maxUses) : '');
    setExpiresAt(c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '');
    setIsActive(c.isActive);
    setErrorMsg('');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'FREE_SHIPPING' ? 0 : Number(value) || 0,
        minOrder: Number(minOrder) || 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
      };

      if (editingCoupon) {
        // Edit flow
        const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Coupon "${json.coupon.code}" updated successfully!`);
          setEditingCoupon(null);
          fetchCoupons();
        } else {
          setErrorMsg(json.error || 'Failed to update coupon');
        }
      } else {
        // Create flow
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Coupon "${json.coupon.code}" created successfully!`);
          setShowCreateModal(false);
          resetForm();
          fetchCoupons();
        } else {
          setErrorMsg(json.error || 'Failed to create coupon');
        }
      }
    } catch {
      setErrorMsg('Network error while saving coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean, codeName: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setCoupons(prev =>
          prev.map(c => (c.id === id ? { ...c, isActive: !currentActive } : c))
        );
        showToast(`Coupon "${codeName}" ${!currentActive ? 'enabled' : 'disabled'}`);
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleSoftDelete = async (id: string, codeName: string) => {
    if (!confirm(`Disable and soft-delete coupon "${codeName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setCoupons(prev =>
          prev.map(c => (c.id === id ? { ...c, isActive: false } : c))
        );
        showToast(`Coupon "${codeName}" disabled (soft deleted)`);
      }
    } catch {
      alert('Failed to disable coupon');
    }
  };

  const formatTypeValue = (typeStr: string, val: number) => {
    const t = typeStr.toUpperCase();
    if (t === 'PERCENTAGE' || t === 'PERCENT') {
      return `${val}% OFF`;
    }
    if (t === 'FREE_SHIPPING' || t === 'FREESHIPPING') {
      return 'Free Shipping';
    }
    return `₹${val.toLocaleString('en-IN')} Flat`;
  };

  const getTypeBadge = (typeStr: string) => {
    const t = typeStr.toUpperCase();
    if (t === 'PERCENTAGE' || t === 'PERCENT') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (t === 'FREE_SHIPPING' || t === 'FREESHIPPING') {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1E6B5C] text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">
            Coupon Codes & Promotional Discounts
          </h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Configure percentage, flat, or free shipping coupons with minimum order rules
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <span>+</span>
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8DCC8] bg-[#FFF8EC]/70 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37]">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Min Order</th>
                <th className="py-3.5 px-4">Uses</th>
                <th className="py-3.5 px-4">Expiry</th>
                <th className="py-3.5 px-4">Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-[#7A5B37] animate-pulse">
                    Loading promotional coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-[#7A5B37]">
                    No coupons created yet. Click &quot;Create Coupon&quot; to add your first promotion.
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => {
                  const isExpired = coupon.expiresAt && new Date() > new Date(coupon.expiresAt);
                  const isExhausted = coupon.maxUses && coupon.usedCount >= coupon.maxUses;

                  return (
                    <tr
                      key={coupon.id}
                      className={`hover:bg-[#FFF8EC]/40 transition ${
                        !coupon.isActive ? 'opacity-60 bg-gray-50/50' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#1E6B5C]">
                        {coupon.code}
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getTypeBadge(
                            coupon.type
                          )}`}
                        >
                          {coupon.type}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 font-bold text-[#553E23]">
                        {formatTypeValue(coupon.type, coupon.value)}
                      </td>

                      {/* Min Order */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#121212]">
                        {coupon.minOrder > 0 ? `₹${coupon.minOrder.toLocaleString('en-IN')}` : 'No Min'}
                      </td>

                      {/* Uses */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-bold text-[#121212]">{coupon.usedCount}</span>
                        <span className="text-[#7A5B37]">
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ' (Unlimited)'}
                        </span>
                        {isExhausted ? (
                          <span className="block text-[10px] text-rose-600 font-bold">Limit Reached</span>
                        ) : null}
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {coupon.expiresAt ? (
                          <div>
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-[#7A5B37]'}>
                              {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {isExpired && (
                              <span className="block text-[10px] text-rose-600 font-bold">Expired</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">Never</span>
                        )}
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(coupon.id, coupon.isActive, coupon.code)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition ${
                            coupon.isActive
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(coupon)}
                          className="text-xs font-bold text-[#1E6B5C] hover:underline px-2 py-1 rounded hover:bg-[#1E6B5C]/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleSoftDelete(coupon.id, coupon.code)}
                          className="text-xs font-bold text-[#BA3D3D] hover:underline px-2 py-1 rounded hover:bg-[#BA3D3D]/10"
                        >
                          Disable / Soft Delete
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

      {/* Modal: Create or Edit Coupon */}
      {(showCreateModal || editingCoupon) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#E8DCC8] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#553E23]">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCoupon(null);
                }}
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

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Coupon Code (Uppercase & Unique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EID20, NOBLE100"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 font-mono font-bold text-sm text-[#1E6B5C] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-bold text-[#553E23] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FLAT">Flat Amount (₹ Off)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    {type === 'PERCENTAGE'
                      ? 'Discount Percentage (%) *'
                      : type === 'FREE_SHIPPING'
                      ? 'Shipping Waived'
                      : 'Flat Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={type === 'FREE_SHIPPING'}
                    placeholder={type === 'PERCENTAGE' ? '20' : type === 'FREE_SHIPPING' ? '0' : '200'}
                    value={type === 'FREE_SHIPPING' ? '0' : value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-bold text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Min Order & Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minOrder}
                    onChange={e => setMinOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-medium text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Max Redemptions (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited if blank"
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-medium text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>
              </div>

              {/* Expiry Date & Active Toggle */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-medium text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#1E6B5C] rounded border-[#E8DCC8] focus:ring-[#1E6B5C]"
                    />
                    <span className="text-xs font-bold text-[#553E23]">Coupon Is Active</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DCC8]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E8DCC8] text-xs font-bold text-[#7A5B37] hover:bg-[#FFF8EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
