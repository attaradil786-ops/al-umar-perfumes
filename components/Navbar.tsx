'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import MobileDrawer from './MobileDrawer';

export default function Navbar() {
  const pathname = usePathname();
  const { itemCount, setIsCartOpen, setIsSearchOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'ALL COLLECTION', href: '/collections' },
    { label: 'BEST SELLERS', href: '/best-sellers' },
    { label: 'NEW ARRIVALS', href: '/new-arrivals' },
    { label: 'CONTACT', href: '/contact' },
    { label: 'ABOUT US', href: '/about' },
    { label: 'BULK ORDER', href: '/bulk-order' },
  ];

  return (
    <>
      <header className="navbar">
        <div className="container nav-container">
          <div className="nav-left">
            <button
              className="icon-btn"
              id="btn-mobile-menu"
              aria-label="Toggle Menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="brand-logo">
              <svg className="brand-icon" viewBox="0 0 24 24">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 7.03,13.82 9,15.2C10.74,16.42 12.35,16.8 13.91,17L14.73,15.08C13.59,14.85 12.43,14.39 11.23,13.5C8.91,11.82 5,4.72 17,8Z" />
              </svg>
              AL UMAR
            </Link>
          </div>

          <nav className="nav-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="nav-right">
            <button
              className="icon-btn"
              id="btn-mobile-search"
              aria-label="Search Collection"
              title="Search"
              onClick={() => setIsSearchOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </button>

            <button
              className="icon-btn"
              id="btn-toggle-cart"
              aria-label="Shopping Cart"
              title="Cart"
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 10a4 4 0 0 1-8 0" />
                <path d="M3.1 6h17.8" />
                <path d="M3.4 5.5a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.7a2 2 0 0 0-.4-1.2L18.6 3A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
              </svg>
              <span
                className="cart-badge"
                style={{ display: itemCount > 0 ? 'flex' : 'none' }}
              >
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
