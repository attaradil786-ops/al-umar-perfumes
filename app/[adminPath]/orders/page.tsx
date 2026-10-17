'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  city: string;
  state: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrdersPage({
  params,
}: {
  params: { adminPath: string };
}) {
  const router = useRouter();
  const basePath = `/${params.adminPath}`;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'all') q.set('status', statusFilter);
      if (paymentFilter !== 'all') q.set('payment', paymentFilter);
      if (searchQuery.trim()) q.set('search', searchQuery.trim());
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      q.set('page', String(page));
      q.set('limit', '20');

      const res = await fetch(`/api/admin/orders?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setTotalCount(data.count || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, searchQuery, startDate, endDate, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(prev =>
          prev.map(o => (o.id === id ? { ...o, status: newStatus } : o))
        );
      } else {
        alert(json.error || 'Failed to update order status');
      }
    } catch {
      alert('Network error while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'packed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'confirmed':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'placed':
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentBadge = (pStatus: string) => {
    switch (pStatus.toLowerCase()) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'refunded':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setPaymentFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">
            Orders & Shipments Management
          </h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Real-time fulfillment, customer notifications dispatch, and order auditing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders()}
            className="bg-white border border-[#E8DCC8] hover:bg-[#FFF8EC] text-[#553E23] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>↻</span> Refresh
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Search by phone or order # */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[#7A5B37] uppercase tracking-wider mb-1">
              Search by Phone, Order #, or Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. ORD-1234, 9876543210, Fatima..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-medium text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
              />
              <span className="absolute left-3 top-3 text-sm text-[#7A5B37]">🔍</span>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#7A5B37] uppercase tracking-wider mb-1">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-semibold text-[#553E23] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#7A5B37] uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={e => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-semibold text-[#553E23] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Date Range Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8DCC8]/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#7A5B37] text-[11px] uppercase">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#E8DCC8] bg-white text-xs font-medium text-[#553E23]"
            />
            <span className="text-[#7A5B37]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#E8DCC8] bg-white text-xs font-medium text-[#553E23]"
            />
          </div>

          <div className="flex items-center gap-2">
            {(statusFilter !== 'all' ||
              paymentFilter !== 'all' ||
              searchQuery ||
              startDate ||
              endDate) && (
              <button
                onClick={resetFilters}
                className="text-[#BA3D3D] hover:underline font-bold text-xs"
              >
                Clear Filters
              </button>
            )}
            <span className="text-[#7A5B37] font-semibold">
              Showing {orders.length} of {totalCount} records
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8DCC8] bg-[#FFF8EC]/80 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37]">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-[#7A5B37]">
                    <div className="inline-block animate-pulse">Loading orders...</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-[#7A5B37]">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const itemsSummary = order.items
                    .map(i => `${i.name} (×${i.quantity})`)
                    .join(', ');
                  const totalItemsCount = order.items.reduce(
                    (acc, i) => acc + i.quantity,
                    0
                  );

                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`${basePath}/orders/${order.id}`)}
                      className="hover:bg-[#FFF8EC]/40 transition cursor-pointer group"
                    >
                      {/* Order # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E6B5C] group-hover:underline">
                        {order.orderNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-[#7A5B37] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-[10px] text-[#A08264]">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#121212]">{order.customerName}</div>
                        <div className="text-[11px] text-[#7A5B37]">
                          {order.city}, {order.state}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#553E23]">
                        {order.phone}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div
                          className="text-xs text-[#121212] truncate font-medium"
                          title={itemsSummary}
                        >
                          {itemsSummary}
                        </div>
                        <div className="text-[10px] text-[#7A5B37] font-semibold">
                          {totalItemsCount} {totalItemsCount === 1 ? 'unit' : 'units'}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-bold text-[#553E23] whitespace-nowrap">
                        ₹{order.total.toLocaleString('en-IN')}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPaymentBadge(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td
                        className="py-3.5 px-4"
                        onClick={e => e.stopPropagation()}
                      >
                        <select
                          value={order.status.toLowerCase()}
                          disabled={updatingId === order.id}
                          onChange={e => handleStatusChange(order.id, e.target.value, e)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="placed">placed</option>
                          <option value="confirmed">confirmed</option>
                          <option value="packed">packed</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination 20/page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs">
            <div className="text-[#7A5B37]">
              Page <span className="font-bold text-[#553E23]">{page}</span> of{' '}
              <span className="font-bold text-[#553E23]">{totalPages}</span> (
              {totalCount} total orders)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#E8DCC8] bg-white font-bold text-[#553E23] hover:bg-[#FFF8EC] disabled:opacity-40 transition"
              >
                ← Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pNum = page - 3 + i;
                  if (pNum > totalPages) pNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                      page === pNum
                        ? 'bg-[#1E6B5C] text-white shadow-sm'
                        : 'bg-white border border-[#E8DCC8] text-[#553E23] hover:bg-[#FFF8EC]'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#E8DCC8] bg-white font-bold text-[#553E23] hover:bg-[#FFF8EC] disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
