import React from 'react';
import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/api';
import ContactForm from './ContactForm';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Contact Concierge & Support | Al Umar Perfumes',
  description:
    'Get in touch with Al Umar Perfumes atelier in Mumbai. Reach out via WhatsApp, phone, or email for scent consultations and order inquiries.',
  openGraph: {
    title: 'Contact Concierge & Support | Al Umar Perfumes',
    description:
      'Connect with our Mumbai atelier for fragrance consultations, wholesale enquiries, and order assistance.',
    url: 'https://alumarperfumes.com/contact',
  },
};

export default async function ContactPage() {
  const [phone, whatsapp, email, hours] = await Promise.all([
    getSiteContent('contact_phone', '+91 98765 43210'),
    getSiteContent('contact_whatsapp', '+91 98765 43210'),
    getSiteContent('contact_email', 'wholesale@umarperfumes.com'),
    getSiteContent('contact_hours', 'Mon - Sat: 10:00 AM - 8:00 PM IST'),
  ]);

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '1.5rem', color: '#1E6B5C' }}>Contact Us</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.25rem', marginBottom: '1rem' }}>Customer Support</h3>
          <p style={{ fontSize: '0.9rem', color: '#553E23', marginBottom: '1rem', lineHeight: 1.6 }}>
            Have questions about an attar note, bulk order, or tracking your package? Reach out anytime.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Phone Support:</strong> {phone}</div>
            <div><strong>WhatsApp:</strong> {whatsapp}</div>
            <div><strong>Email:</strong> {email}</div>
            <div><strong>Hours:</strong> {hours}</div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="btn-green" style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '0.75rem' }}>
              Call Customer Support
            </a>
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Hello%20Al%20Umar%20Perfumes`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '0.75rem' }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.25rem', marginBottom: '1rem' }}>Send a Message</h3>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
