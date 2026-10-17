'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  const links = [
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="mobile-nav-drawer active z-50" id="mobile-nav-drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #E8DCC8' }}>
          <span className="brand-logo" style={{ fontSize: '1.2rem' }}>AL UMAR</span>
          <button
            id="btn-close-mobile-nav"
            onClick={onClose}
            style={{ fontSize: '1.2rem', cursor: 'pointer', background: 'none', border: 'none', color: '#553E23' }}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {links.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
