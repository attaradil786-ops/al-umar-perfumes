'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const fetchTracking = async (num: string, ph: string) => {
    if (!num.trim() || !ph.trim()) {
      setError('Please provide both Order Number and Phone Number.');
      return;
    }

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: num.trim(), phone: ph.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderData(data.order);
      } else {
        setError(data.error || 'No matching order found. Please check your details.');
      }
    } catch {
      setError('Network error while checking order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber && initialPhone) {
      fetchTracking(initialOrderNumber, initialPhone);
    }
  }, [initialOrderNumber, initialPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderNumber, phone);
  };

  // Timeline steps
  const steps = [
    { key: 'placed', label: 'Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'packed', label: 'Packed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) return 4;
    if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) return 3;
    if (s.includes('pack')) return 2;
    if (s.includes('confirm') || s.includes('paid')) return 1;
    return 0; // placed
  };

  const currentStepIdx = orderData ? getStepIndex(orderData.status) : 0;

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '1.5rem', color: '#1E6B5C' }}>
        Track Your Order
      </h1>

      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <p style={{ color: '#553E23', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Enter your <strong>Order Number</strong> (from confirmation email/receipt) and your <strong>10-digit Phone Number</strong> to check delivery progress.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
              Order Number *
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="e.g. ORD-123456-7890"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#553E23', marginBottom: '0.3rem' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', height: '46px' }}
            >
              {loading ? 'Locating Package...' : 'Track Package →'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ padding: '0.9rem', background: '#f8d7da', color: '#721c24', borderRadius: '8px', border: '1px solid #f5c6cb', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            ✕ {error}
          </div>
        )}
      </div>

      {/* Tracking Results Card */}
      {orderData && (
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
          {/* Top Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #E8DCC8', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#7A5B37', fontWeight: 600 }}>Tracking Order</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#553E23', fontFamily: 'monospace' }}>
                #{orderData.orderNumber}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#7A5B37' }}>Recipient: <strong>{orderData.customerName}</strong></span>
              <div style={{ fontSize: '0.85rem', color: '#1E6B5C', fontWeight: 600, marginTop: '0.2rem' }}>
                Destination: {orderData.address}
              </div>
            </div>
          </div>

          {/* Timeline: Placed → Confirmed → Packed → Shipped → Delivered */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.15rem', marginBottom: '1.5rem' }}>
              Package Journey Timeline
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', position: 'relative', gap: '0.5rem' }}>
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                    {/* Circle Node */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        background: isCompleted ? '#1E6B5C' : '#F0EAE1',
                        color: isCompleted ? '#FFF8EC' : '#7A5B37',
                        border: isCurrent ? '3px solid #D4AF37' : 'none',
                        boxShadow: isCurrent ? '0 0 10px rgba(212, 175, 55, 0.5)' : 'none',
                        zIndex: 2,
                      }}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>

                    {/* Step Label */}
                    <span
                      style={{
                        marginTop: '0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? 800 : isCompleted ? 600 : 400,
                        color: isCompleted ? '#1E6B5C' : '#7A5B37',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Live Tracking Link if available */}
          <div style={{ background: '#FFF8EC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E8DCC8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#553E23' }}>
                {orderData.awbNumber ? `AWB Tracking: ${orderData.awbNumber}` : 'Status: In Preparation at Atelier'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7A5B37', marginTop: '0.2rem' }}>
                {orderData.trackingUrl
                  ? 'Real-time courier updates available from shipping partner.'
                  : 'Items are securely cushioned in tamper-evident packaging before courier pickup.'}
              </div>
            </div>

            {orderData.trackingUrl ? (
              <a
                href={orderData.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Open Live Courier Tracker ↗
              </a>
            ) : (
              <a
                href={`https://wa.me/919876543210?text=Hello%20Al%20Umar,%20checking%20status%20for%20order%20%23${orderData.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Inquire via WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="container-narrow section-padding text-center">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
