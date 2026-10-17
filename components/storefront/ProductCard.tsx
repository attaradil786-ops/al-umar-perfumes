'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface ProductProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    price: number;
    mrp?: number | null;
    images?: string[];
    image_url?: string;
    rating?: number;
    reviewsCount?: number;
  };
}

export default function ProductCard({ product }: ProductProps) {
  const { addToCart, setQuickViewProduct } = useCart();
  const imageUrl = product.images?.[0] || product.image_url || '/images/hero-perfume.jpg';

  return (
    <div className="bg-white rounded-2xl border border-[#E8DCC8] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Product Image & Badges */}
      <div className="aspect-square relative bg-[#F8F4EC] overflow-hidden">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
            }}
          />
        </Link>

        {/* Category Pill */}
        <span className="absolute top-3 left-3 bg-[#1E6B5C] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
          {product.category}
        </span>

        {/* Quick View Button (Tap to view details) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuickViewProduct(product);
          }}
          className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-[#553E23] px-2.5 py-1.5 rounded-xl shadow-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition duration-300 flex items-center gap-1.5 text-[11px] font-bold z-10"
          title="Quick View Item Info"
          aria-label="Quick View Item Info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="hidden xs:inline">Info</span>
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-bold mb-1">
            <span>★</span>
            <span>{product.rating || 4.8}</span>
            <span className="text-[#7A5B37] font-normal">
              ({product.reviewsCount || 42})
            </span>
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3 className="font-serif font-bold text-[#121212] text-base group-hover:text-[#1E6B5C] transition line-clamp-1 mb-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-[#7A5B37] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-[#E8DCC8] flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-[#553E23]">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            {product.mrp && product.mrp > product.price && (
              <div className="text-[10px] text-[#7A5B37] line-through -mt-0.5">
                ₹{product.mrp.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, '6ml', 1)}
            className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-sm hover:shadow flex items-center gap-1"
          >
            <span>+ Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
