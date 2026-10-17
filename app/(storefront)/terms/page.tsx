import React from 'react';
import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Terms of Service | Al Umar Perfumes',
  description:
    'Terms of service, purchasing conditions, artisanal oil disclosures, and jurisdiction governing Al Umar Perfumes.',
  openGraph: {
    title: 'Terms of Service | Al Umar Perfumes',
    description:
      'Review store terms, order conditions, and consumer rights for Al Umar artisanal fragrance purchases.',
    url: 'https://alumarperfumes.com/terms',
  },
};

export default async function TermsPage() {
  const [customTerms, customOldTerms] = await Promise.all([
    getSiteContent('terms_of_service'),
    getSiteContent('terms_policy'),
  ]);

  const activeTerms = customTerms || customOldTerms;

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '2rem', color: '#1E6B5C' }}>
        Terms of Service
      </h1>
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', lineHeight: 1.8, color: '#4A3F33' }}>
        {activeTerms ? (
          activeTerms.includes('<') ? (
            <div className="prose max-w-none text-[#4A3F33]" dangerouslySetInnerHTML={{ __html: activeTerms }} />
          ) : (
            <div style={{ whiteSpace: 'pre-line' }}>{activeTerms}</div>
          )
        ) : (
          <>
            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: '#7A5B37' }}>
              Effective Date: October 2026 • Al Umar Perfumes, Mumbai, India
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              By accessing, browsing, or purchasing from <strong>Al Umar Perfumes</strong> (&ldquo;we&rdquo;, &ldquo;website&rdquo;, &ldquo;store&rdquo;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service, along with our Privacy Policy and Shipping &amp; Returns Policies.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              2. Artisanal Products &amp; Natural Variations
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Our products are authentic, alcohol-free artisanal attars, pure Cambodian Dehn Al Oud, and botanical extracts. Because natural woods and botanical harvests fluctuate with climate and harvest seasons, subtle nuances in hue, viscosity, and olfactory top-notes across aging batches are authentic hallmarks of artisanal distillation and do not constitute product defects.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              3. Pricing &amp; GST Compliance
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              All prices listed on our boutique are in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST) at statutory rates (typically 18% under HSN 3303). We reserve the right to revise catalog pricing, promotional codes, or product availability without prior notice.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              4. Orders, Payments &amp; Dispatch
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Orders are confirmed only after successful payment authorization via our authorized payment partner, Razorpay. In the event of pricing or stock discrepancies, we reserve the right to decline or refund an order. Standard domestic shipments dispatch within 24 to 48 hours from our Mumbai atelier.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              5. Intellectual Property
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              All content on this website—including brand emblems, bottle calligraphy, product photography, fragrance descriptions, and design motifs—is the exclusive intellectual property of Al Umar Perfumes and protected under Indian and international copyright laws.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              6. Limitation of Liability &amp; Governing Law
            </h2>
            <p>
              To the fullest extent permissible by law, Al Umar Perfumes shall not be liable for indirect, incidental, or consequential damages resulting from store usage or product application. These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra</strong>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
