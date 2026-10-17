'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal } = useCart();

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 1500;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-[#FFF8EC] border-l border-[#E8DCC8] shadow-2xl flex flex-col justify-between z-10">
          {/* Header */}
          <div className="p-6 border-b border-[#E8DCC8] flex items-center justify-between bg-white">
            <div className="font-serif text-xl font-bold text-[#553E23]">
              Your Cart <span className="text-xs font-sans text-[#7A5B37] font-normal">({cart.length} items)</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-gray-700 font-bold text-lg p-1"
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
                  <span>Add <strong className="text-[#1E6B5C]">₹{amountNeeded}</strong> more for Free Shipping</span>
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
                <div className="text-4xl">🧴</div>
                <div className="font-serif text-lg font-bold text-[#553E23]">Your shopping cart is empty</div>
                <p className="text-xs text-[#7A5B37] max-w-xs mx-auto">
                  Explore our pure Cambodian Oud, velvet White Musks, and inspiring Islamic texts.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition shadow"
                >
                  Browse Fragrances
                </button>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.id}-${item.size || 'std'}-${idx}`}
                  className="bg-white p-4 rounded-xl border border-[#E8DCC8] shadow-sm flex gap-4 items-center"
                >
                  <div className="w-16 h-16 rounded-lg bg-[#F8F4EC] border border-[#E8DCC8] overflow-hidden flex-shrink-0">
                    <img
                      src={item.image_url || (item as any).image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#121212] truncate">{item.name}</h4>
                    <div className="text-xs text-[#7A5B37] mt-0.5">
                      {item.size ? `Size: ${item.size} • ` : ''}₹{item.price.toLocaleString('en-IN')}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#E8DCC8] rounded-md bg-[#FFF8EC]/40">
                        <button
                          onClick={() => updateQuantity(item.id, -1, item.size)}
                          className="px-2 py-0.5 text-xs text-[#553E23] hover:bg-[#E8DCC8] transition font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#553E23]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1, item.size)}
                          className="px-2 py-0.5 text-xs text-[#553E23] hover:bg-[#E8DCC8] transition font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-xs text-red-600 hover:text-red-800 transition"
                      >
                        Remove
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

              {/* STEP 7: Proceed to Checkout Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full bg-[#1E6B5C] hover:bg-[#165A4A] text-white py-3.5 rounded-xl text-center text-sm font-bold tracking-wide transition shadow-md hover:shadow-lg block"
              >
                Proceed to Checkout →
              </Link>

              {/* STEP 7: Small WhatsApp help link below */}
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
