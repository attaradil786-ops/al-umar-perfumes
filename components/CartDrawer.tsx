'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, setQuickViewProduct } = useCart();

  // STEP 3: Freeze background store screen when cart drawer is open
  useEffect(() => {
    if (isCartOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 1500;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // STEP 5: Open item info / Quick View from cart
  const handleOpenItemInfo = (item: any) => {
    setIsCartOpen(false);
    setQuickViewProduct({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category || 'Attar',
      images: item.images && item.images.length > 0 ? item.images : [item.image_url || item.image || '/images/hero-perfume.jpg'],
      image_url: item.image_url || item.image || '/images/hero-perfume.jpg',
      size: item.size || '6ml',
      slug: item.slug,
      description:
        item.description ||
        `Handcrafted luxury ${item.category || 'fragrance'} distilled using traditional pure distillation techniques. Long-lasting, alcohol-free, and skin-safe.`,
      rating: item.rating || 4.9,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Background Freeze Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
        style={{ pointerEvents: 'auto' }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className="w-screen max-w-md bg-[#FFF8EC] border-l border-[#E8DCC8] shadow-2xl flex flex-col justify-between z-10 pointer-events-auto animate-slide-left"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#E8DCC8] flex items-center justify-between bg-white">
            <div className="font-serif text-xl font-bold text-[#553E23] flex items-center gap-2">
              <span>🛍️</span>
              <span>Your Cart</span>
              <span className="text-xs font-sans text-[#7A5B37] font-normal bg-[#FFF8EC] border border-[#E8DCC8] px-2 py-0.5 rounded-full">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-black font-bold text-lg p-1.5 rounded-lg hover:bg-gray-100 transition"
              aria-label="Close Cart"
            >
              ✕
            </button>
          </div>

          {/* Free Shipping Progress Tracker */}
          <div className="p-4 bg-white border-b border-[#E8DCC8] space-y-1.5">
            <div className="text-xs font-semibold text-[#553E23] flex justify-between">
              <span>
                {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <span className="text-emerald-700 font-bold">🎉 You qualify for Free Domestic Shipping!</span>
                ) : (
                  <span>
                    Add <strong className="text-[#1E6B5C]">₹{amountNeeded.toLocaleString('en-IN')}</strong> more for Free Shipping
                  </span>
                )}
              </span>
              <span className="font-bold text-xs">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#E8DCC8]/50 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#1E6B5C] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-4xl animate-bounce">🧴</div>
                <div className="font-serif text-lg font-bold text-[#553E23]">Your shopping cart is empty</div>
                <p className="text-xs text-[#7A5B37] max-w-xs mx-auto">
                  Explore our pure Cambodian Oud, velvet White Musks, and inspiring Islamic collections.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow"
                >
                  Browse Fragrances
                </button>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.id}-${item.size || 'std'}-${idx}`}
                  className="bg-white p-4 rounded-xl border border-[#E8DCC8] shadow-sm flex gap-4 items-center hover:border-[#1E6B5C]/40 transition group"
                >
                  {/* Clickable Image -> Opens Item Info Modal */}
                  <button
                    type="button"
                    onClick={() => handleOpenItemInfo(item)}
                    className="w-16 h-16 rounded-lg bg-[#F8F4EC] border border-[#E8DCC8] overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition relative group/img text-left"
                    title="Click to view fragrance details"
                  >
                    <img
                      src={item.image_url || (item as any).image || '/images/hero-perfume.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
                      }}
                    />
                    <span className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                      Info ℹ️
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Clickable Name -> Opens Item Info Modal */}
                    <button
                      type="button"
                      onClick={() => handleOpenItemInfo(item)}
                      className="text-left font-bold text-sm text-[#121212] hover:text-[#1E6B5C] transition truncate block w-full"
                      title="Click to view product details"
                    >
                      {item.name}
                    </button>

                    <div className="text-xs text-[#7A5B37] mt-0.5 flex items-center gap-2">
                      {item.size && (
                        <span className="bg-[#FFF8EC] border border-[#E8DCC8] px-1.5 py-0.2 rounded text-[10px]">
                          {item.size}
                        </span>
                      )}
                      <span className="font-semibold text-[#553E23]">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#E8DCC8] rounded-lg bg-[#FFF8EC]/60 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1, item.size)}
                          className="px-2.5 py-1 text-xs text-[#553E23] hover:bg-[#E8DCC8] transition font-bold"
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-3 text-xs font-bold text-[#553E23] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1, item.size)}
                          className="px-2.5 py-1 text-xs text-[#553E23] hover:bg-[#E8DCC8] transition font-bold"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Prominent Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition"
                        title="Remove item from cart"
                      >
                        <span>🗑️</span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-[#E8DCC8] space-y-3">
              <div className="flex items-center justify-between font-serif text-lg font-bold text-[#553E23]">
                <span>Estimated Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-[#7A5B37]">
                Taxes & promotional discounts calculated at checkout.
              </div>

              {/* Proceed to Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-3.5 rounded-xl text-center text-sm font-bold tracking-wide transition shadow-md hover:shadow-lg block"
              >
                Proceed to Checkout →
              </Link>

              {/* WhatsApp Help */}
              <div className="text-center pt-1">
                <a
                  href="https://wa.me/919876543210?text=Hi%20Al%20Umar,%20I%20have%20a%20question%20about%20my%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1E6B5C] hover:text-[#165A4A] font-semibold hover:underline inline-flex items-center gap-1.5 transition"
                >
                  <span>💬</span> Need help? Chat on WhatsApp
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
