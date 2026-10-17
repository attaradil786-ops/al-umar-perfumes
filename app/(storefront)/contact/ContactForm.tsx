'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    e.currentTarget.reset();
  };

  return (
    <>
      {submitted && (
        <div style={{ padding: '0.75rem', background: '#e6f4ea', color: '#137333', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #ceead6' }}>
          ✓ Thank you! Your message has been received. Our team will contact you shortly.
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Your Name"
          required
          style={{ padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          type="email"
          placeholder="Your Email"
          required
          style={{ padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none' }}
        />
        <textarea
          placeholder="Your Message or Inquiry..."
          rows={4}
          required
          style={{ padding: '0.75rem', border: '1px solid #D1C8BA', borderRadius: '8px', fontFamily: 'inherit', outline: 'none', resize: 'none' }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>
          Send Message
        </button>
      </form>
    </>
  );
}
