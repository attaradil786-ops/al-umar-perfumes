import React from 'react';
import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Returns & Cancellation Policy | Al Umar Perfumes',
  description:
    'Al Umar Perfumes cancellation and return policy. 100% full refund on pre-dispatch cancellation; 7-day returns for damaged or defective items.',
  openGraph: {
    title: 'Returns & Cancellation Policy | Al Umar Perfumes',
    description:
      'Clear return and cancellation guidelines for artisanal perfumes, Cambodian Oud, and heritage items.',
    url: 'https://alumarperfumes.com/return-policy',
  },
};

export default async function ReturnPolicyPage() {
  const [customReturnPolicy, customCancellationPolicy] = await Promise.all([
    getSiteContent('return_policy'),
    getSiteContent('cancellation_policy'),
  ]);

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '2rem', color: '#1E6B5C' }}>
        Returns &amp; Cancellation Policy
      </h1>
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', lineHeight: 1.8, color: '#4A3F33' }}>
        {/* Custom Cancellation Policy if set in SiteContent */}
        {customCancellationPolicy && (
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px dashed #E8DCC8' }}>
            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              Order Cancellation Policy
            </h2>
            {customCancellationPolicy.includes('<') ? (
              <div className="prose max-w-none text-[#4A3F33]" dangerouslySetInnerHTML={{ __html: customCancellationPolicy }} />
            ) : (
              <div style={{ whiteSpace: 'pre-line' }}>{customCancellationPolicy}</div>
            )}
          </div>
        )}

        {/* Custom Return Policy or Full Compliant Defaults */}
        {customReturnPolicy ? (
          customReturnPolicy.includes('<') ? (
            <div className="prose max-w-none text-[#4A3F33]" dangerouslySetInnerHTML={{ __html: customReturnPolicy }} />
          ) : (
            <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
              {customReturnPolicy}
            </div>
          )
        ) : (
          <>
            {!customCancellationPolicy && (
              <>
                <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
                  1. Order Cancellation
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  • <strong>Cancellation Before Shipment:</strong> You may cancel any order prior to dispatch for an immediate <strong>100% full refund</strong>. The full transaction amount will be credited back to your original payment method (UPI/Card/Net Banking) within 24 to 48 business hours.
                  <br />• <strong>Cancellation After Shipment:</strong> Once a consignment has been handed to our courier partner and an AWB tracking number has been generated, in-transit cancellation is not possible. You may initiate a return within <strong>7 days</strong> of package delivery in accordance with our return guidelines below.
                </p>
              </>
            )}

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              2. 7-Day Return Window
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We gladly accept returns for damaged, leaking, defective, or incorrectly dispatched items within <strong>7 days</strong> of package delivery. If you receive an impaired bottle, please contact our concierge at <strong>wholesale@umarperfumes.com</strong> or WhatsApp with unboxing photographs or video proof.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              3. Perfume Hygiene &amp; Cosmetic Standards
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              In accordance with domestic cosmetic regulations and health hygiene protocols, pure perfume oils, attars, and incense products whose inner protective seal or applicator rod has been unsealed cannot be returned or refunded once used, unless verified manufacturing defect or transit damage occurred.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              4. Reverse Logistics &amp; Refund Processing
            </h2>
            <p>
              Upon verification, we schedule a free reverse pickup through our logistics network. Refunds are processed and credited to the original bank account or card within <strong>5 to 7 business days</strong> following inspection at our Mumbai fulfillment atelier.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
