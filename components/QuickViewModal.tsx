'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('6ml');
  const [quantity, setQuantity] = useState(1);

  // Freeze background when Quick View is active
  useEffect(() => {
    if (quickViewProduct) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [quickViewProduct]);

  const product = quickViewProduct;
  const rawVariants = product && Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = rawVariants.length > 0;
  const isAttar = product && (product.category?.toLowerCase().includes('attar') || product.category?.toLowerCase().includes('perfume'));
  const isBook = product && (product.category?.toLowerCase().includes('book') || product.category?.toLowerCase().includes('quran'));

  // Reset selected size when product changes
  useEffect(() => {
    if (product) {
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        setSelectedSize(product.variants[0].label);
      } else if (isAttar) {
        setSelectedSize('6ml');
      } else {
        setSelectedSize('Standard');
      }
      setQuantity(1);
    }
  }, [product?.id]);

  if (!quickViewProduct) return null;

  const activeVariant = hasVariants ? rawVariants.find((v: any) => v.label === selectedSize) || rawVariants[0] : null;

  const calculatePrice = () => {
    if (activeVariant) return activeVariant.price;
    let p = product.price;
    if (isAttar) {
      if (selectedSize === '12ml') p = Math.round(product.price * 1.7);
      if (selectedSize === '3ml') p = Math.round(product.price * 0.6);
    }
    return p;
  };

  const currentPrice = calculatePrice();
  const currentStock = activeVariant ? activeVariant.stock : (product.stock ?? 10);

  const handleAdd = () => {
    if (currentStock <= 0) return;
    addToCart(
      {
        ...product,
        price: currentPrice,
      },
      hasVariants ? selectedSize : (isAttar ? selectedSize : undefined),
      quantity
    );
    setQuickViewProduct(null);
  };

  const dimensionLabel = (() => {
    if (product.unitType === 'cm' || isBook) return 'Dimension (cm)';
    if (product.unitType === 'g') return 'Weight (grams)';
    if (product.unitType === 'ml' || isAttar) return 'Volume (ml)';
    return 'Size / Option';
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setQuickViewProduct(null)}
      />

      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E8DCC8] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2">
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-lg z-20"
        >
          ✕
        </button>

        {/* Product Image */}
        <div className="aspect-square bg-[#F8F4EC] relative overflow-hidden flex items-center justify-center p-6">
          <img
            src={product.images?.[0] || product.image_url || '/images/hero-perfume.jpg'}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl"
            onError={e => {
              (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
            }}
          />
        </div>

        {/* Product Details */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FFF8EC] border border-[#E8DCC8] text-[#1E6B5C]">
              {product.category}
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#121212] mt-2 mb-1">
              {product.name}
            </h2>
            <div className="text-xs text-amber-500 font-bold mb-3">
              ★ {product.rating || 4.9} Verified Rating
            </div>
            <p className="text-xs text-[#7A5B37] leading-relaxed line-clamp-3">
              {product.description}
            </p>
          </div>

          {/* Size / Dimension picker */}
          {(hasVariants || isAttar) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#553E23] uppercase">
                  {dimensionLabel}
                </label>
                {activeVariant && (
                  <span className="text-[10px] font-semibold text-[#1E6B5C]">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {hasVariants ? (
                  rawVariants.map((v: any) => {
                    const isSelected = selectedSize === v.label;
                    const isOutOfStock = v.stock <= 0;
                    return (
                      <button
                        key={v.id || v.label}
                        type="button"
                        onClick={() => setSelectedSize(v.label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition text-left cursor-pointer ${
                          isSelected
                            ? 'border-[#1E6B5C] bg-[#1E6B5C] text-white shadow-sm'
                            : 'border-[#E8DCC8] bg-[#FFF8EC]/40 text-[#553E23] hover:bg-[#E8DCC8]'
                        } ${isOutOfStock ? 'opacity-60' : ''}`}
                      >
                        <span>{v.label}</span>
                        {isOutOfStock ? (
                          <span className="ml-1 text-[9px] uppercase font-normal">(Sold out)</span>
                        ) : (
                          <span className="ml-1.5 opacity-80 text-[10px]">₹{v.price}</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  ['3ml', '6ml', '12ml'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        selectedSize === size
                          ? 'border-[#1E6B5C] bg-[#1E6B5C] text-white shadow-sm'
                          : 'border-[#E8DCC8] bg-[#FFF8EC]/40 text-[#553E23] hover:bg-[#E8DCC8]'
                      }`}
                    >
                      {size}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quantity & Price */}
          <div className="pt-3 border-t border-[#E8DCC8]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xl font-bold text-[#553E23]">
                  ₹{(currentPrice * quantity).toLocaleString('en-IN')}
                </span>
                {quantity > 1 && (
                  <span className="text-xs text-[#7A5B37] ml-2">
                    (₹{currentPrice.toLocaleString('en-IN')} each)
                  </span>
                )}
              </div>

              {/* Quantity incrementor */}
              <div className="flex items-center border border-[#E8DCC8] rounded-lg bg-[#FFF8EC]/40">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-[#E8DCC8] text-[#553E23] cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-[#553E23]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-[#E8DCC8] text-[#553E23] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={currentStock <= 0}
                className="w-full bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-3 rounded-xl text-xs font-bold tracking-wide transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {currentStock <= 0 ? `Sold Out (${selectedSize})` : `Add to Cart • ₹${(currentPrice * quantity).toLocaleString('en-IN')}`}
              </button>
              <Link
                href={`/product/${product.slug}`}
                onClick={() => setQuickViewProduct(null)}
                className="block text-center text-xs font-bold text-[#7A5B37] hover:text-[#1E6B5C] transition pt-1 cursor-pointer"
              >
                View Full Product Specs →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
