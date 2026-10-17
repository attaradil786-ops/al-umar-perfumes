'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export interface OfferData {
  id: string;
  title: string;
  description: string;
  code?: string | null;
  bannerImage?: string | null;
  placement: 'top_bar' | 'hero' | 'popup' | string;
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
  position: number;
}

interface OfferBannerProps {
  placement: 'top_bar' | 'hero' | 'popup';
  defaultText?: string;
  children?: React.ReactNode;
}

export default function OfferBanner({
  placement,
  defaultText = 'Welcome to our store • Free Shipping Across India on Orders Above ₹1500',
  children,
}: OfferBannerProps) {
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.offers)) {
          const matchingOffers = data.offers.filter(
            (o: OfferData) => o.placement === placement && o.isActive
          );
          if (matchingOffers.length > 0) {
            const selected = matchingOffers[0];
            setOffer(selected);

            if (placement === 'popup') {
              // Check session cookie / sessionStorage
              const hasSeen = sessionStorage.getItem(`al_umar_popup_${selected.id}`);
              if (!hasSeen) {
                setShowPopup(true);
              }
            }
          }
        }
      })
      .catch(console.error);
  }, [placement]);

  const handleDismissPopup = () => {
    if (offer) {
      sessionStorage.setItem(`al_umar_popup_${offer.id}`, 'true');
      document.cookie = `al_umar_popup_${offer.id}=true; path=/; max-age=86400; SameSite=Lax`;
    }
    setShowPopup(false);
  };

  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1. TOP_BAR PLACEMENT (replaces announcement bar text)
  if (placement === 'top_bar') {
    if (offer) {
      return (
        <div className="announcement-bar bg-[#1E6B5C] text-white py-2 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2">
          <span>✨</span>
          <span>
            <strong>{offer.title}</strong>: {offer.description}
          </span>
          {offer.code && (
            <span className="ml-1 bg-[#D4AF37] text-[#553E23] px-2 py-0.5 rounded font-mono font-bold text-[11px] shadow-sm">
              Use code: {offer.code}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="announcement-bar">
        {children || defaultText}
      </div>
    );
  }

  // 2. HERO PLACEMENT (overlay on homepage hero)
  if (placement === 'hero') {
    if (!offer) return null;

    return (
      <div className="my-6 mx-auto max-w-4xl px-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#553E23] via-[#44301B] to-[#1E6B5C] text-[#FFF8EC] p-6 sm:p-8 shadow-2xl border border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
              <span>👑 Special Atelier Offer</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {offer.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#FFF8EC]/90 max-w-lg leading-relaxed">
              {offer.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 z-10 shrink-0">
            {offer.code && (
              <button
                type="button"
                onClick={() => handleCopyCode(offer.code!)}
                className="bg-[#FFF8EC]/10 hover:bg-[#FFF8EC]/20 border border-[#D4AF37] px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-[#D4AF37] transition flex items-center gap-2"
              >
                <span>{offer.code}</span>
                <span className="text-[10px] uppercase font-sans text-white/80">
                  {copied ? '✓ Copied' : 'Copy'}
                </span>
              </button>
            )}
            <Link
              href="/collections"
              className="bg-[#D4AF37] hover:bg-[#C49E27] text-[#553E23] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md"
            >
              Shop Fragrances →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. POPUP PLACEMENT (modal once per session)
  if (placement === 'popup' && showPopup && offer) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#FFF8EC] rounded-3xl border-2 border-[#D4AF37] p-8 max-w-md w-full shadow-2xl text-center relative space-y-4">
          <button
            onClick={handleDismissPopup}
            className="absolute top-4 right-4 text-[#7A5B37] hover:text-[#553E23] font-bold text-xl w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="w-14 h-14 rounded-full bg-[#1E6B5C] text-[#D4AF37] text-2xl font-serif font-bold flex items-center justify-center mx-auto shadow-md">
            ع
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">
              Complimentary Invitation
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#553E23]">
              {offer.title}
            </h3>
          </div>

          <p className="text-xs text-[#7A5B37] leading-relaxed">
            {offer.description}
          </p>

          {offer.code && (
            <div className="bg-white p-3 rounded-2xl border border-[#E8DCC8] flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-[#1E6B5C]">
                {offer.code}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(offer.code!)}
                className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
              >
                {copied ? '✓ Copied' : 'Copy Code'}
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleDismissPopup}
              className="w-full bg-[#553E23] hover:bg-[#43301B] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md"
            >
              Explore Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
