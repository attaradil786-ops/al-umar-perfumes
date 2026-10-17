'use client';

import React, { useState } from 'react';

export default function BulkOrderPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    e.currentTarget.reset();
  };

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '1.5rem', color: '#1E6B5C' }}>Bulk &amp; Wholesale Orders</h1>
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ color: '#4A3F33', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          We supply retail boutiques, mosques, corporate gift hampers, and wedding return favors with custom branding and wholesale discounts on our premium attars, gift chests, and Islamic books.
        </p>

        {submitted && (
          <div style={{ padding: '1rem', background: '#e6f4ea', color: '#137333', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem', border: '1px solid #ceead6' }}>
            ✓ Wholesale inquiry submitted! Our corporate sales desk will contact you via WhatsApp / phone shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#553E23' }}>Contact Name</label>
              <input type="text" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#553E23' }}>Company / Organization</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#553E23' }}>Phone Number</label>
              <input type="tel" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#553E23' }}>Email Address</label>
              <input type="email" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#553E23' }}>Order Requirements (Products &amp; Quantities)</label>
            <textarea rows={4} placeholder="e.g. 50 units of Royal Dehn Al Oud 6ml, 30 units of Velvet Gift Chests..." required style={{ width: '100%', padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none', resize: 'none' }}></textarea>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '0.9rem', fontSize: '1rem' }}>
            Submit Wholesale Inquiry
          </button>
        </form>
      </div>
    </main>
  );
}
