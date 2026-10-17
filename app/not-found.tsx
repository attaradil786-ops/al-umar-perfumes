import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found (404) | Al Umar Perfumes',
  description: 'The requested page could not be located in our perfume catalog.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8EC] text-[#553E23] px-6 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E8DCC8] p-8 sm:p-10 text-center shadow-xl space-y-6">
        {/* Emblem */}
        <div className="w-16 h-16 mx-auto rounded-full bg-[#1E6B5C]/10 border border-[#1E6B5C]/30 flex items-center justify-center text-[#1E6B5C] font-serif font-bold text-2xl shadow-sm">
          ع
        </div>

        <div className="space-y-2">
          <div className="font-serif text-6xl font-bold tracking-tight text-[#1E6B5C]">
            404
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#553E23] tracking-wide">
            Scent Lost in Transit
          </h1>
          <p className="text-xs sm:text-sm text-[#7A5B37] leading-relaxed max-w-sm mx-auto">
            The page or fragrance flacon you are seeking could not be found or has moved to an exclusive archive.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/collections"
            className="w-full sm:w-auto bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm text-center"
          >
            Explore Collections
          </Link>
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
