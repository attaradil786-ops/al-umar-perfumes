import React from 'react';
import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Al Umar Perfumes',
  description:
    'Domestic delivery across India within 3 to 5 business days via BlueDart, DTDC, and Delhivery. Free shipping on all orders above ₹1500.',
  openGraph: {
    title: 'Shipping & Delivery Policy | Al Umar Perfumes',
    description:
      'Learn about our Mumbai atelier dispatch timelines, domestic shipping partners, and transit protection.',
    url: 'https://alumarperfumes.com/shipping-policy',
  },
};

export default async function ShippingPolicyPage() {
  const customPolicy = await getSiteContent('shipping_policy');

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '2rem', color: '#1E6B5C' }}>Shipping Policy</h1>
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', lineHeight: 1.8, color: '#4A3F33' }}>
        {customPolicy ? (
          customPolicy.includes('<') ? (
            <div className="prose max-w-none text-[#4A3F33]" dangerouslySetInnerHTML={{ __html: customPolicy }} />
          ) : (
            <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
              {customPolicy}
            </div>
          )
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              1. Order Processing Time
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              All perfume orders and book parcels are carefully prepared and dispatched within 24 to 48 hours from our Mumbai perfume atelier.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              2. Domestic Delivery Within India
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Standard delivery takes 3 to 5 business days via premium express couriers (BlueDart, DTDC, Delhivery). Orders above ₹1500 qualify for free express shipping.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              3. Packaging Safety
            </h2>
            <p>
              Our fragrances and tasbih prayer beads are packed with protective cushioning and tamper-evident seals to ensure pristine condition upon arrival.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
