'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  productId: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string | null;
  status: string;
  paymentStatus: string;
  paymentId?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  shipmentId?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage({
  params,
}: {
  params: { adminPath: string; id: string };
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const basePath = `/${params.adminPath}`;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setStatus(data.order.status.toLowerCase());
        setAwbNumber(data.order.awbNumber || '');
        setTrackingUrl(data.order.trackingUrl || '');
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  // Handle Dispatch / Status Updates
  const handleSaveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          awbNumber: awbNumber.trim() || null,
          trackingUrl: trackingUrl.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.order);
        setStatus(json.order.status.toLowerCase());
        showToast('Order fulfillment updated & customer notification triggered!');
      } else {
        showToast(json.error || 'Failed to update order', 'error');
      }
    } catch {
      showToast('Network error updating order', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Quick Status Dropdown Change
  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          awbNumber: awbNumber.trim() || null,
          trackingUrl: trackingUrl.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.order);
        showToast(`Status updated to "${newStatus}" & notification dispatched!`);
      } else {
        showToast(json.error || 'Failed to update status', 'error');
      }
    } catch {
      showToast('Network error updating status', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Refund
  const handleRefund = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      `Are you sure you want to process a full refund of ₹${order.total.toLocaleString(
        'en-IN'
      )} for Order #${order.orderNumber}? This will call the Razorpay refund API.`
    );
    if (!confirmed) return;

    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/refund`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.order);
        showToast(`Refund processed successfully (ID: ${json.refundId})!`);
      } else {
        showToast(json.error || 'Failed to initiate refund', 'error');
      }
    } catch {
      showToast('Network error processing refund', 'error');
    } finally {
      setRefunding(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'refunded':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'failed':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#7A5B37] animate-pulse">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="text-xl font-bold text-[#BA3D3D]">Order Not Found</div>
        <Link
          href={`${basePath}/orders`}
          className="text-xs font-bold text-[#1E6B5C] underline"
        >
          ← Return to Orders List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2.5 transition transform duration-200 ${
            toast.type === 'error'
              ? 'bg-[#BA3D3D] text-white'
              : 'bg-[#1E6B5C] text-white'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#7A5B37] mb-1.5 flex items-center gap-2">
            <Link href={`${basePath}/orders`} className="hover:underline">
              Orders
            </Link>
            <span>/</span>
            <span className="font-mono text-[#1E6B5C] font-semibold">
              {order.orderNumber}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-[#553E23]">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusBadge(
                order.status
              )}`}
            >
              {order.status}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getPaymentBadge(
                order.paymentStatus
              )}`}
            >
              Payment: {order.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-[#7A5B37] mt-1">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Action Buttons: Print Invoice, Print Packing Slip, Back */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/admin/orders/${order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <span>📄</span>
            <span>Print Invoice (GST)</span>
          </a>

          <a
            href={`/api/admin/orders/${order.id}/packing-slip`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-[#FFF8EC] text-[#553E23] border border-[#E8DCC8] px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <span>📋</span>
            <span>Print Packing Slip</span>
          </a>

          <Link
            href={`${basePath}/orders`}
            className="bg-white hover:bg-[#FFF8EC] text-[#7A5B37] border border-[#E8DCC8] px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Main Order Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items Table, Totals, Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-[#553E23] border-b border-[#E8DCC8] pb-3 mb-4 flex items-center justify-between">
              <span>Order Items ({order.items.length})</span>
              <span className="text-xs font-mono text-[#7A5B37]">
                Total Units: {order.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </h2>

            <div className="divide-y divide-[#E8DCC8]/60">
              {order.items.map(item => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-[#121212]">{item.name}</div>
                    <div className="text-xs text-[#7A5B37] mt-0.5">
                      {item.size ? `Size: ${item.size} • ` : ''}Unit Price: ₹
                      {item.price.toLocaleString('en-IN')} × Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-sm text-[#553E23] whitespace-nowrap">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Block */}
            <div className="mt-6 pt-5 border-t border-[#E8DCC8] space-y-2.5 text-xs">
              <div className="flex justify-between text-[#7A5B37]">
                <span>Items Subtotal:</span>
                <span className="font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({order.couponCode || 'APPLIED'}):</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-[#7A5B37]">
                <span>Shipping Charges:</span>
                <span className="font-medium">
                  {order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#553E23] pt-3 border-t border-[#E8DCC8]">
                <span>Grand Total:</span>
                <span className="text-[#1E6B5C]">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Customer Block */}
          <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-[#553E23] border-b border-[#E8DCC8] pb-3 mb-4">
              Customer & Delivery Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-[#7A5B37] uppercase tracking-wider block mb-1">
                  Recipient Name
                </span>
                <p className="font-bold text-sm text-[#121212]">{order.customerName}</p>
              </div>

              <div>
                <span className="font-bold text-[#7A5B37] uppercase tracking-wider block mb-1">
                  Contact Phone (WhatsApp)
                </span>
                <p className="font-mono text-sm text-[#1E6B5C] font-semibold">{order.phone}</p>
              </div>

              <div>
                <span className="font-bold text-[#7A5B37] uppercase tracking-wider block mb-1">
                  Email Address
                </span>
                <p className="text-[#121212] font-medium">{order.email || 'None specified'}</p>
              </div>

              <div>
                <span className="font-bold text-[#7A5B37] uppercase tracking-wider block mb-1">
                  Destination Region
                </span>
                <p className="text-[#121212] font-medium">
                  {order.city}, {order.state} - {order.pincode}
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-[#E8DCC8]/60">
                <span className="font-bold text-[#7A5B37] uppercase tracking-wider block mb-1">
                  Complete Shipping Address
                </span>
                <p className="text-[#553E23] leading-relaxed font-medium bg-[#FFF8EC]/60 p-3 rounded-lg border border-[#E8DCC8]/60">
                  {order.address}
                  <br />
                  {order.city}, {order.state} - <span className="font-mono font-bold">{order.pincode}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Fulfillment, Payment & Refund */}
        <div className="space-y-6">
          {/* Status Dropdown & Fulfillment Form */}
          <form
            onSubmit={handleSaveFulfillment}
            className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm space-y-4"
          >
            <h2 className="font-serif text-lg font-bold text-[#553E23] border-b border-[#E8DCC8] pb-3">
              Fulfillment Status
            </h2>

            {/* Status Dropdown: placed → confirmed → packed → shipped → delivered / cancelled */}
            <div>
              <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1.5">
                Order Lifecycle Status
              </label>
              <select
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider outline-none cursor-pointer ${getStatusBadge(
                  status
                )}`}
              >
                <option value="placed">placed</option>
                <option value="confirmed">confirmed</option>
                <option value="packed">packed</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
              <p className="text-[10px] text-[#7A5B37] mt-1.5 leading-relaxed">
                * Changing status automatically triggers email & WhatsApp notification to the customer.
              </p>
            </div>

            {/* AWB Number */}
            <div>
              <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1.5">
                AWB / Waybill Number
              </label>
              <input
                type="text"
                placeholder="e.g. BLUEDART-99281726"
                value={awbNumber}
                onChange={e => setAwbNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-mono font-bold text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
              />
            </div>

            {/* Tracking URL */}
            <div>
              <label className="block text-[11px] font-bold text-[#553E23] uppercase tracking-wider mb-1.5">
                Shipment Tracking URL
              </label>
              <input
                type="url"
                placeholder="https://track.shiprocket.in/..."
                value={trackingUrl}
                onChange={e => setTrackingUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs text-[#121212] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-3 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Dispatch & AWB'}
            </button>
          </form>

          {/* Payment Block & Refund */}
          <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#553E23] border-b border-[#E8DCC8] pb-3">
              Payment & Reconciliation
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#7A5B37] font-semibold">Payment Status:</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPaymentBadge(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#7A5B37] font-semibold">Gateway Transaction ID:</span>
                <span className="font-mono text-[#553E23] text-[11px] truncate max-w-[170px]" title={order.paymentId || 'N/A'}>
                  {order.paymentId || 'None (Simulated / COD)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#7A5B37] font-semibold">Captured Amount:</span>
                <span className="font-bold text-[#1E6B5C] text-sm">
                  ₹{order.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Refund Action */}
            <div className="pt-3 border-t border-[#E8DCC8] space-y-2">
              <span className="block text-[11px] font-bold text-[#7A5B37] uppercase tracking-wider">
                Refund Processing
              </span>
              {order.paymentStatus.toLowerCase() === 'refunded' ? (
                <div className="bg-sky-50 border border-sky-200 text-sky-800 p-3 rounded-xl text-xs font-semibold text-center">
                  ✓ Refund already initiated & credited to customer
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRefund}
                  disabled={refunding}
                  className="w-full bg-[#BA3D3D] hover:bg-[#9B2E2E] text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>↺</span>
                  <span>{refunding ? 'Initiating Refund...' : 'Refund Order via Razorpay'}</span>
                </button>
              )}
              <p className="text-[10px] text-[#7A5B37] leading-relaxed">
                Triggers a reverse chargeback via Razorpay API and marks paymentStatus as &quot;refunded&quot;.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
