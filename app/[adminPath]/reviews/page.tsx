'use client';

import React, { useEffect, useState } from 'react';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Counts {
  pending: number;
  approved: number;
  total: number;
}

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModeration = async (id: string, action: 'approve' | 'reject') => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: action === 'approve' } : r))
        );
        setCounts((prev) => ({
          ...prev,
          pending: action === 'approve' ? Math.max(0, prev.pending - 1) : prev.pending,
          approved: action === 'approve' ? prev.approved + 1 : Math.max(0, prev.approved - 1),
        }));
      } else {
        alert(data.error || 'Failed to update review status');
      }
    } catch {
      alert('Error connecting to server');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        const deletedReview = reviews.find((r) => r.id === id);
        setReviews((prev) => prev.filter((r) => r.id !== id));
        if (deletedReview) {
          setCounts((prev) => ({
            ...prev,
            pending: !deletedReview.isApproved ? Math.max(0, prev.pending - 1) : prev.pending,
            approved: deletedReview.isApproved ? Math.max(0, prev.approved - 1) : prev.approved,
            total: Math.max(0, prev.total - 1),
          }));
        }
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch {
      alert('Error deleting review');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredReviews = reviews
    .filter((r) => (activeTab === 'pending' ? !r.isApproved : r.isApproved))
    .filter((r) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.product.name.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">Customer Reviews & Moderation</h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Moderate customer feedback, approve genuine testimonials, and protect storefront authenticity
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search reviews or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8DCC8] bg-white text-[#553E23] placeholder-[#7A5B37]/60 focus:ring-2 focus:ring-[#1E6B5C] outline-none"
          />
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-3 border-b border-[#E8DCC8] pb-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-[#1E6B5C] text-white shadow-sm'
              : 'text-[#7A5B37] hover:bg-white hover:text-[#553E23]'
          }`}
        >
          <span>⏳ Pending Moderation</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'bg-[#1E6B5C] text-white shadow-sm'
              : 'text-[#7A5B37] hover:bg-white hover:text-[#553E23]'
          }`}
        >
          <span>✓ Approved Reviews</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'approved' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {counts.approved}
          </span>
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8DCC8] bg-[#FFF8EC]/60 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37]">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Review Comment</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#7A5B37]">
                    Loading reviews...
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#7A5B37]">
                    {searchTerm
                      ? 'No reviews match your search query.'
                      : activeTab === 'pending'
                      ? '🎉 No reviews pending moderation. All clear!'
                      : 'No approved reviews yet.'}
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#FFF8EC]/30 transition">
                    <td className="py-3.5 px-4 font-bold text-[#121212] max-w-[180px]">
                      <div className="truncate" title={rev.product.name}>
                        {rev.product.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#553E23]">
                      {rev.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-bold text-sm">
                          {'★'.repeat(Math.round(rev.rating))}
                        </span>
                        <span className="text-[11px] text-[#7A5B37]">({rev.rating})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#7A5B37] max-w-sm">
                      <p className="line-clamp-2 leading-relaxed">{rev.comment}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleModeration(rev.id, 'approve')}
                              disabled={actionLoadingId === rev.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              <span>✓</span> Approve
                            </button>
                            <button
                              onClick={() => handleDelete(rev.id)}
                              disabled={actionLoadingId === rev.id}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              Reject & Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleModeration(rev.id, 'reject')}
                              disabled={actionLoadingId === rev.id}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              Unapprove
                            </button>
                            <button
                              onClick={() => handleDelete(rev.id)}
                              disabled={actionLoadingId === rev.id}
                              className="text-red-600 hover:text-red-800 px-2 py-1 text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
