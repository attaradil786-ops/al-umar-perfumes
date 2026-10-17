import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4 className="footer-heading">Shop Links</h4>
          <ul className="footer-links">
            <li>
              <Link href="/collections?category=attar">Premium Attars</Link>
            </li>
            <li>
              <Link href="/collections?category=attar">White Musk</Link>
            </li>
            <li>
              <Link href="/collections?category=attar">Floral Attars</Link>
            </li>
            <li>
              <Link href="/collections?category=gifts">Gift Sets</Link>
            </li>
            <li>
              <Link href="/collections?category=books">Islamic Books</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="footer-heading">Customer Care</h4>
          <ul className="footer-links">
            <li>
              <Link href="/track-order">Track Delivery</Link>
            </li>
            <li>
              <Link href="/contact">Contact Us</Link>
            </li>
            <li>
              <Link href="/bulk-order">Bulk & Wholesale</Link>
            </li>
            <li>
              <Link href="/about">About Umar Perfumes</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="footer-heading">Policies</h4>
          <ul className="footer-links">
            <li>
              <Link href="/shipping-policy">Shipping Policy</Link>
            </li>
            <li>
              <Link href="/return-policy">Return & Cancellation Policy</Link>
            </li>
            <li>
              <Link href="/privacy-policy">Privacy Policy (DPDP)</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="footer-heading">Our Mission</h4>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 248, 236, 0.8)', lineHeight: 1.6 }}>
            Curating the finest oriental fragrances, pure Cambodian Oud oil, Taif rose extracts, and inspiring Islamic texts to enrich your spiritual lifestyle.
          </p>
        </div>
      </div>

      <div className="container footer-copy">
        © 2026 Al Umar Perfumes Inc. All rights reserved. Handcrafted with devotion.
      </div>
    </footer>
  );
}
