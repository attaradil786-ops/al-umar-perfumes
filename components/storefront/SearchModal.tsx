'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  images: string[];
  description: string;
}

export default function SearchModal() {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/products?q=${encodeURIComponent(query)}&limit=8`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.products) {
            setResults(res.products);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Freeze background when Search is active
  useEffect(() => {
    if (isSearchOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E8DCC8] overflow-hidden z-10 animate-fade-in">
        {/* Search Input */}
        <div className="p-4 border-b border-[#E8DCC8] flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7A5B37]">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.34-4.34" />
          </svg>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Cambodian Oud, Taif Rose, White Musk, Books..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium outline-none text-[#121212] placeholder-[#7A5B37]/60"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-gray-400 hover:text-black font-bold p-1 text-xs"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 divide-y divide-[#E8DCC8]/60">
          {loading && (
            <div className="text-center py-8 text-xs text-[#7A5B37]">Searching collection...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-xs text-[#7A5B37]">
              No fragrances or books found matching &quot;{query}&quot;.
            </div>
          )}

          {!loading && results.map(item => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              onClick={() => setIsSearchOpen(false)}
              className="py-3 px-2 flex items-center gap-4 hover:bg-[#FFF8EC] rounded-xl transition group"
            >
              <div className="w-14 h-14 rounded-lg bg-[#F8F4EC] border border-[#E8DCC8] overflow-hidden flex-shrink-0">
                <img
                  src={item.images?.[0] || '/images/hero-perfume.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  onError={e => {
                    (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#121212] group-hover:text-[#1E6B5C] transition truncate">
                  {item.name}
                </div>
                <div className="text-[11px] text-[#7A5B37] truncate">{item.description}</div>
              </div>
              <div className="font-bold text-sm text-[#553E23]">
                ₹{item.price.toLocaleString('en-IN')}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
