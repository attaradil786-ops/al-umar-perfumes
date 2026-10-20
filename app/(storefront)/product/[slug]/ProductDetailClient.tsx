'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/storefront/ProductCard';
import { trackViewItem } from '@/lib/analytics';

interface ProductVariant {
  id: string;
  label: string;
  dimensionOrSize?: string;
  unit?: string;
  price: number;
  mrp?: number | null;
  stock: number;
}

interface ProductProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  mrp: number | null;
  stock: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  unitType?: string | null;
  variants?: ProductVariant[] | null;
  reviews: Array<{
    id: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

type RelatedProduct = React.ComponentProps<typeof ProductCard>['product'];

export default function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: ProductProps;
  relatedProducts: RelatedProduct[];
}) {
  const router = useRouter();
  const { addToCart } = useCart();

  const rawVariants = Array.isArray(product.variants) ? (product.variants as ProductVariant[]) : [];
  const hasVariants = rawVariants.length > 0;
  const isPerfume = product.category.toLowerCase().includes('attar') || product.category.toLowerCase().includes('perfume');
  const defaultSizeOptions = isPerfume ? ['3ml', '6ml', '12ml'] : ['Standard Edition'];

  const [selectedSize, setSelectedSize] = useState<string>(
    hasVariants ? rawVariants[0].label : defaultSizeOptions[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '/images/hero-perfume.jpg');
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews' | 'shipping'>('desc');

  // Review form states
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Delivery check state
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{
    serviceable: boolean;
    rate?: number;
    estimatedDeliveryDays?: number;
    courierName?: string;
    cod?: boolean;
    freeShipping?: boolean;
    message?: string;
  } | null>(null);
  const [deliveryError, setDeliveryError] = useState('');

  const handleCheckDelivery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = deliveryPincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setDeliveryError('Please enter a valid 6-digit Indian PIN code');
      setDeliveryResult(null);
      return;
    }

    setCheckingDelivery(true);
    setDeliveryError('');
    try {
      const declaredVal = currentPrice * quantity;
      const res = await fetch(
        `/api/shipping/check-serviceability?pincode=${cleanPin}&declaredValue=${declaredVal}&weight=0.5`
      );
      const data = await res.json();
      if (!res.ok) {
        setDeliveryError(data.error || 'Failed to check delivery serviceability');
        setDeliveryResult(null);
      } else {
        setDeliveryResult({
          serviceable: Boolean(data.serviceable),
          rate: data.rate,
          estimatedDeliveryDays: data.estimatedDeliveryDays,
          courierName: data.courierName,
          cod: data.cod,
          freeShipping: Boolean(data.freeShipping),
        });
      }
    } catch {
      setDeliveryError('Network error checking delivery. Please try again.');
      setDeliveryResult(null);
    } finally {
      setCheckingDelivery(false);
    }
  };

  // Active variant resolution
  const activeVariant = hasVariants
    ? rawVariants.find(v => v.label === selectedSize) || rawVariants[0]
    : null;

  // Calculate size-based price and stock
  let currentPrice = product.price;
  let currentMrp = product.mrp;
  let currentStock = product.stock;

  if (activeVariant) {
    currentPrice = activeVariant.price;
    currentMrp = activeVariant.mrp || (product.mrp ? Math.round(activeVariant.price * (product.mrp / product.price)) : null);
    currentStock = activeVariant.stock;
  } else if (isPerfume) {
    if (selectedSize === '6ml') {
      currentPrice = Math.round(product.price * 1.85);
      if (currentMrp) currentMrp = Math.round(currentMrp * 1.85);
    } else if (selectedSize === '12ml') {
      currentPrice = Math.round(product.price * 3.3);
      if (currentMrp) currentMrp = Math.round(currentMrp * 3.3);
    }
  }

  // Analytics: GA4 & Meta Pixel view_item
  useEffect(() => {
    try {
      trackViewItem({
        id: product.id,
        name: product.name,
        price: currentPrice,
        category: product.category,
      });
    } catch {
      // ignore analytics error
    }
  }, [product.id, product.name, currentPrice, product.category]);

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        mrp: currentMrp || undefined,
        image: product.images[0] || '/images/hero-perfume.jpg',
        category: product.category,
      },
      selectedSize,
      quantity
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleWhatsAppOrder = () => {
    const text = `Salaam! I would like to order:
*${product.name}* (${selectedSize})
Quantity: ${quantity}
Price: ₹${currentPrice * quantity}
Link: ${window.location.href}`;
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: reviewName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setReviewName('');
        setReviewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#7A5B37] mb-8">
        <Link href="/" className="hover:text-[#1E6B5C]">Home</Link>
        <span>/</span>
        <Link href="/collections" className="hover:text-[#1E6B5C]">Collections</Link>
        <span>/</span>
        <span className="text-[#553E23] font-semibold truncate">{product.name}</span>
      </nav>

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 bg-white p-6 md:p-10 rounded-3xl border border-[#E8DCC8] shadow-sm mb-16">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#FFF8EC] border border-[#E8DCC8] relative shadow-inner">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.mrp && product.mrp > product.price && (
              <span className="absolute top-4 left-4 bg-[#8C2D19] text-white text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider">
                SAVE {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImage === img ? 'border-[#1E6B5C] shadow-md scale-95' : 'border-[#E8DCC8] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E6B5C] bg-[#1E6B5C]/10 px-2.5 py-0.5 rounded-full">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-[#D4AF37]">
                {'★'.repeat(Math.round(product.rating))}
                <span className="text-gray-400 font-sans ml-1">({product.reviewsCount} verified reviews)</span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#553E23] leading-tight">
              {product.name}
            </h1>

            {/* Price display */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-serif text-3xl font-bold text-[#1E6B5C]">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentMrp && currentMrp > currentPrice && (
                <span className="text-base text-gray-400 line-through">
                  ₹{currentMrp.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-xs text-gray-500 font-medium">(Incl. all taxes)</span>
            </div>

            {/* Stock status */}
            <div className="text-xs font-semibold flex items-center gap-1.5 pt-1">
              {currentStock > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-700">
                    In Stock • Ready to dispatch in 24 hours
                    {currentStock <= 5 && (
                      <strong className="ml-1 text-amber-700 font-bold">(Only {currentStock} left in {selectedSize}!)</strong>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-red-700 font-semibold">
                    Currently Sold Out for <strong>{selectedSize}</strong>
                  </span>
                </>
              )}
            </div>

            <p className="text-sm text-[#7A5B37] leading-relaxed pt-2">
              {product.description}
            </p>

            {/* Size / Dimension selector */}
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider">
                  {product.unitType === 'cm' || product.category.toLowerCase().includes('book') || product.category.toLowerCase().includes('quran')
                    ? 'Select Book / Quran Dimension (cm)'
                    : product.unitType === 'g'
                    ? 'Select Weight (grams)'
                    : product.unitType === 'ml' || isPerfume
                    ? 'Select Volume / Bottle Size (ml)'
                    : 'Select Size / Option'}
                </label>
                {activeVariant && (
                  <span className="text-[11px] font-semibold text-[#1E6B5C]">
                    Selected: {activeVariant.label} (₹{currentPrice.toLocaleString('en-IN')})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {hasVariants ? (
                  rawVariants.map((v) => {
                    const isSelected = selectedSize === v.label;
                    const isOutOfStock = v.stock <= 0;
                    return (
                      <button
                        key={v.id || v.label}
                        type="button"
                        onClick={() => setSelectedSize(v.label)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border text-left flex flex-col gap-0.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E6B5C] text-[#FFF8EC] border-[#1E6B5C] shadow-sm'
                            : 'bg-[#FFF8EC] text-[#553E23] border-[#E8DCC8] hover:border-[#1E6B5C]'
                        } ${isOutOfStock ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{v.label}</span>
                          {isOutOfStock && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                              Sold out
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] ${isSelected ? 'text-[#FFF8EC]/90' : 'text-[#1E6B5C]'} font-semibold`}>
                          ₹{v.price.toLocaleString('en-IN')}
                          {v.stock > 0 && v.stock <= 5 && (
                            <span className="ml-1 text-amber-500 font-bold">• {v.stock} left</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  defaultSizeOptions.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-[#1E6B5C] text-[#FFF8EC] border-[#1E6B5C] shadow-sm'
                          : 'bg-[#FFF8EC] text-[#553E23] border-[#E8DCC8] hover:border-[#1E6B5C]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider">
                Quantity
              </label>
              <div className="inline-flex items-center border border-[#E8DCC8] rounded-xl bg-[#FFF8EC] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-base text-[#553E23] hover:bg-[#E8DCC8]/40 transition font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="w-12 text-center text-xs font-bold text-[#553E23]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-1.5 text-base text-[#553E23] hover:bg-[#E8DCC8]/40 transition font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-6 border-t border-[#E8DCC8]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1E6B5C] text-[#FFF8EC] font-serif font-bold text-sm hover:bg-[#165246] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                {currentStock <= 0 ? 'SOLD OUT' : 'ADD TO CART'}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="w-full py-3.5 px-6 rounded-xl bg-[#553E23] text-[#FFF8EC] font-serif font-bold text-sm hover:bg-[#43301a] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {currentStock <= 0 ? 'SOLD OUT' : 'BUY NOW'}
              </button>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 px-4 rounded-xl bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 font-bold text-xs hover:bg-[#25D366]/20 transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              Quick Order via WhatsApp
            </button>

            {/* Shiprocket Delivery Serviceability Checker */}
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E8DCC8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#553E23] flex items-center gap-1.5">
                    <span>🚚</span> Check Delivery &amp; COD Availability
                  </span>
                  <span className="text-[10px] text-[#7A5B37]">Shiprocket Express</span>
                </div>

                <form onSubmit={handleCheckDelivery} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN Code"
                    value={deliveryPincode}
                    onChange={(e) => {
                      setDeliveryPincode(e.target.value.replace(/\D/g, ''));
                      setDeliveryError('');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-[#D1C8BA] bg-white text-[#121212] focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                  />
                  <button
                    type="submit"
                    disabled={checkingDelivery || deliveryPincode.trim().length !== 6}
                    className="px-4 py-2 bg-[#1E6B5C] hover:bg-[#165A4A] text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {checkingDelivery ? 'Checking...' : 'Check'}
                  </button>
                </form>

                {deliveryError && (
                  <p className="text-[11px] text-red-600 font-medium">✕ {deliveryError}</p>
                )}

                {deliveryResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                      deliveryResult.serviceable
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {deliveryResult.serviceable ? (
                      <>
                        <div className="font-bold flex items-center gap-1 text-emerald-800">
                          <span>✓</span> Serviceable to PIN {deliveryPincode}!
                        </div>
                        <div className="text-[11px] text-emerald-700 flex flex-wrap gap-x-3 gap-y-1">
                          <span>
                            • Estimated Delivery:{' '}
                            <strong>
                              {deliveryResult.estimatedDeliveryDays
                                ? `${deliveryResult.estimatedDeliveryDays} days`
                                : '2-4 business days'}
                            </strong>
                          </span>
                          {deliveryResult.courierName && (
                            <span>• Partner: {deliveryResult.courierName}</span>
                          )}
                          <span>
                            • Shipping:{' '}
                            <strong className="text-emerald-800">
                              {deliveryResult.freeShipping
                                ? 'FREE (Orders > ₹1500)'
                                : `₹${deliveryResult.rate || 79}`}
                            </strong>
                          </span>
                          {deliveryResult.cod && <span>• Cash on Delivery Available</span>}
                        </div>
                      </>
                    ) : (
                      <div className="font-semibold text-[11px] text-red-700">
                        ✕ Sorry, delivery is currently not serviceable to PIN {deliveryPincode}. Please try an alternate delivery address.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#FFF8EC] border border-[#E8DCC8]">
                <p className="text-[10px] font-bold text-[#553E23]">100% PURE</p>
                <p className="text-[9px] text-[#7A5B37]">Zero Alcohol</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFF8EC] border border-[#E8DCC8]">
                <p className="text-[10px] font-bold text-[#553E23]">FREE SHIPPING</p>
                <p className="text-[9px] text-[#7A5B37]">Orders &gt; ₹1500</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFF8EC] border border-[#E8DCC8]">
                <p className="text-[10px] font-bold text-[#553E23]">SECURE COD</p>
                <p className="text-[9px] text-[#7A5B37]">Across India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Details / Reviews / Shipping */}
      <div className="bg-white rounded-3xl border border-[#E8DCC8] p-6 md:p-10 shadow-sm mb-16">
        <div className="flex border-b border-[#E8DCC8] gap-6 text-sm font-serif font-bold mb-6">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'desc'
                ? 'border-[#1E6B5C] text-[#1E6B5C]'
                : 'border-transparent text-gray-500 hover:text-[#553E23]'
            }`}
          >
            Product Story &amp; Notes
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'reviews'
                ? 'border-[#1E6B5C] text-[#1E6B5C]'
                : 'border-transparent text-gray-500 hover:text-[#553E23]'
            }`}
          >
            Customer Reviews ({product.reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'shipping'
                ? 'border-[#1E6B5C] text-[#1E6B5C]'
                : 'border-transparent text-gray-500 hover:text-[#553E23]'
            }`}
          >
            Delivery &amp; Authenticity Guarantee
          </button>
        </div>

        {activeTab === 'desc' && (
          <div className="space-y-4 text-xs sm:text-sm text-[#553E23] leading-relaxed">
            <p>{product.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-[#FFF8EC] rounded-xl border border-[#E8DCC8]">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#1E6B5C] mb-1">Top Notes</h5>
                <p className="text-xs text-[#7A5B37]">Fresh, uplifting aroma that welcomes the senses upon first contact.</p>
              </div>
              <div className="p-4 bg-[#FFF8EC] rounded-xl border border-[#E8DCC8]">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#1E6B5C] mb-1">Heart Notes</h5>
                <p className="text-xs text-[#7A5B37]">Warm woody, amber, and rare floral resins evolving gently throughout the day.</p>
              </div>
              <div className="p-4 bg-[#FFF8EC] rounded-xl border border-[#E8DCC8]">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#1E6B5C] mb-1">Base Notes</h5>
                <p className="text-xs text-[#7A5B37]">Deep, meditative Cambodian agarwood and natural deer musk persistence (12-24h longevity).</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Reviews List */}
            <div className="space-y-4">
              {product.reviews.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No approved reviews yet. Be the first to share your experience!</p>
              ) : (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-[#FFF8EC]/60 border border-[#E8DCC8] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#553E23]">{rev.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-[#D4AF37]">
                      {'★'.repeat(Math.round(rev.rating))}
                    </div>
                    <p className="text-xs text-[#7A5B37]">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Review Form */}
            <div className="bg-[#FFF8EC] p-6 rounded-2xl border border-[#E8DCC8]">
              <h4 className="font-serif font-bold text-sm text-[#553E23] mb-3">Write a Customer Review</h4>
              {reviewSuccess ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium">
                  JazakAllah Khair! Your review has been submitted for verification.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      className="text-xs p-2.5 rounded-xl border border-[#E8DCC8] focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="text-xs p-2.5 rounded-xl border border-[#E8DCC8] focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                    >
                      <option value={5}>5 Stars - Pure Perfection</option>
                      <option value={4}>4 Stars - High Quality</option>
                      <option value={3}>3 Stars - Good</option>
                      <option value={2}>2 Stars - Average</option>
                      <option value={1}>1 Star - Needs Improvement</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe the fragrance projection, longevity, and your impressions..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E8DCC8] focus:outline-none focus:ring-1 focus:ring-[#1E6B5C]"
                  ></textarea>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-[#1E6B5C] text-[#FFF8EC] text-xs font-bold rounded-xl hover:bg-[#165246] transition disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-3 text-xs sm:text-sm text-[#553E23] leading-relaxed">
            <p>
              • <strong>Express Dispatch:</strong> All orders placed before 2:00 PM IST are hand-packed with tamper-evident seals and dispatched the same day via Delhivery / Blue Dart.
            </p>
            <p>
              • <strong>Shipping Charges:</strong> Free standard shipping across India on all carts above ₹1500. Flat ₹100 fee applies for smaller orders.
            </p>
            <p>
              • <strong>Authenticity:</strong> Each bottle is guaranteed 100% alcohol-free, ethically sourced, and matured in traditional seasoned glass containers.
            </p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#553E23]">
              You May Also Appreciate
            </h3>
            <Link href="/collections" className="text-xs font-bold text-[#1E6B5C] hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
