import React from 'react';
import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Privacy Policy & DPDP Act Compliance | Al Umar Perfumes',
  description:
    'Al Umar Perfumes privacy policy complying with India Digital Personal Data Protection Act 2023 (DPDP Act). Details on cookies, Razorpay, Shiprocket, GA4, Meta, and user rights.',
  openGraph: {
    title: 'Privacy Policy & DPDP Act Compliance | Al Umar Perfumes',
    description:
      'Learn how we safeguard personal data in compliance with the Digital Personal Data Protection Act 2023 (DPDP Act), cookie usage, and customer rights.',
    url: 'https://alumarperfumes.com/privacy-policy',
  },
};

export default async function PrivacyPolicyPage() {
  const customPolicy = await getSiteContent('privacy_policy');

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '2rem', color: '#1E6B5C' }}>
        Privacy Policy &amp; Data Protection
      </h1>
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
            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: '#7A5B37' }}>
              Last Updated: October 2026 • Compliant with Digital Personal Data Protection Act 2023 (DPDP Act, India)
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              1. Compliance with DPDP Act 2023 (India)
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Al Umar Perfumes (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to handling your personal data responsibly and transparently in strict compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of the Republic of India. We process personal data solely on lawful grounds, including your explicit consent and fulfillment of contractual obligations (such as order delivery and invoice compliance).
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              2. Personal Data We Collect
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              To process purchases and fulfill fragrance deliveries across India, we collect:
              <br />• <strong>Identity &amp; Contact Data:</strong> Name, delivery address, postal pincode, contact telephone/WhatsApp number, and email address.
              <br />• <strong>Transactional Data:</strong> Order reference number, purchased attar options, invoice amounts, and transaction status.
              <br />• <strong>Technical Data:</strong> IP address, device type, and browser details used for fraud mitigation and site stability.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              3. Cookies &amp; Tracking Technologies
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We use essential session cookies to remember items stored in your shopping cart and maintain checkout status. Additionally, analytical cookies assist us in understanding storefront performance, page response times, and navigational flow. You may restrict or disable cookies via your browser settings; however, certain shopping cart functionalities may become unavailable.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              4. Third-Party Service Providers &amp; Data Processors
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We collaborate with trusted partners to securely operate our boutique. We only disclose necessary details required for specific services:
              <br />• <strong>Razorpay:</strong> Facilitates encrypted UPI, Net Banking, Credit/Debit card payments under PCI-DSS Level 1 compliance. We never capture or store raw card or banking credentials.
              <br />• <strong>Shiprocket &amp; Courier Partners (BlueDart, DTDC, Delhivery):</strong> Receive recipient name, address, and contact number solely to complete door-to-door transit and provide real-time SMS/WhatsApp tracking updates.
              <br />• <strong>Google Analytics 4 (GA4):</strong> Collects aggregated, pseudonymized usage statistics to improve user experience and catalog accessibility.
              <br />• <strong>Meta Pixel:</strong> Measures campaign conversions and optimizes relevant storefront announcements.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              5. Data Retention Period
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Transactional and tax invoice records are retained for a minimum statutory duration of <strong>7 years</strong> in accordance with the Goods and Services Tax (GST) Act and Indian accounting compliance regulations. Marketing communication preferences are retained until consent is revoked.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              6. Your Rights Under DPDP Act 2023
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              As a Data Principal under Indian law, you are entitled to:
              <br />• <strong>Right to Access:</strong> Request a summary of personal data held about you.
              <br />• <strong>Right to Correction &amp; Erasure:</strong> Rectify inaccurate details or request deletion of obsolete records (subject to statutory GST invoice requirements).
              <br />• <strong>Right of Grievance Redressal:</strong> Submit privacy concerns directly to our dedicated Data Protection Officer.
              <br />• <strong>Right to Nominate:</strong> Nominate an individual to exercise rights on your behalf in case of incapacity.
            </p>

            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.3rem', marginBottom: '0.75rem' }}>
              7. Grievance Redressal &amp; Privacy Contact
            </h2>
            <p>
              For privacy inquiries, rights requests, or grievance redressal, please contact our Data Protection Officer at <strong>wholesale@umarperfumes.com</strong> or via postal dispatch to: Al Umar Perfumes, Bhendi Bazaar, South Mumbai, Maharashtra 400003, India.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
