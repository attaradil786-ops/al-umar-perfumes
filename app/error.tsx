'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error to Sentry
    console.error('Al Umar App Error:', error);
    try {
      Sentry.captureException(error);
    } catch {
      // Sentry fallback
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8EC] text-[#553E23] px-6 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E8DCC8] p-8 sm:p-10 text-center shadow-xl space-y-6">
        {/* Emblem */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[#1E6B5C]/10 border border-[#1E6B5C]/30 flex items-center justify-center text-[#1E6B5C] font-serif font-bold text-2xl shadow-sm">
          ع
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#553E23] px-3 py-1 rounded-full">
            Atelier Disruption
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#553E23] tracking-wide">
            Something went momentarily amiss
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5B37] leading-relaxed max-w-sm mx-auto">
            Our artisanal boutique encountered an unexpected fragrance note. Our team has been automatically alerted.
          </p>
        </div>

        {error?.digest && (
          <div className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg inline-block">
            Reference Code: {error.digest}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
          >
            ↻ Reload Atelier
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#553E23] border border-[#E8DCC8] px-6 py-2.5 rounded-xl text-xs font-bold transition text-center"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
