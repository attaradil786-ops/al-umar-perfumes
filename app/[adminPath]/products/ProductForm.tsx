'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface ProductVariant {
  id: string;
  label: string;
  dimensionOrSize?: string;
  unit?: string;
  price: number;
  mrp?: number | null;
  stock: number;
}

interface ProductData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  mrp?: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  taxRate?: number;
  hsnCode?: string;
  unitType?: string;
  variants?: ProductVariant[];
}

interface ProductFormProps {
  adminPath: string;
  initialData?: ProductData;
  isEdit?: boolean;
}

export default function ProductForm({
  adminPath,
  initialData,
  isEdit = false,
}: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'attar');
  const [price, setPrice] = useState<number | string>(initialData?.price ?? '');
  const [mrp, setMrp] = useState<number | string>(initialData?.mrp ?? '');
  const [stock, setStock] = useState<number | string>(initialData?.stock ?? 15);
  const [images, setImages] = useState<string[]>(initialData?.images || ['/images/hero-perfume.jpg']);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isBestSeller, setIsBestSeller] = useState(initialData?.isBestSeller ?? false);
  const [isNewArrival, setIsNewArrival] = useState(initialData?.isNewArrival ?? false);
  const [taxRate, setTaxRate] = useState<number | string>(initialData?.taxRate ?? 18);
  const [hsnCode, setHSNCode] = useState(initialData?.hsnCode || '3303');

  // Dimension & Variants States
  const [unitType, setUnitType] = useState<string>(
    initialData?.unitType || (initialData?.category === 'books' ? 'cm' : 'ml')
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    Array.isArray(initialData?.variants) ? (initialData.variants as ProductVariant[]) : []
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const basePath = `/${adminPath}`;

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (variants.length === 0) {
      if (val === 'books') {
        setUnitType('cm');
      } else if (val === 'attar') {
        setUnitType('ml');
      }
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  // Preset Loaders
  const loadPerfumePresets = () => {
    setUnitType('ml');
    const base = Number(price) || 499;
    setVariants([
      { id: `var-3ml-${Date.now()}`, label: '3ml', dimensionOrSize: '3', unit: 'ml', price: Math.round(base * 0.6), mrp: Math.round(base * 0.75), stock: 15 },
      { id: `var-6ml-${Date.now()}`, label: '6ml', dimensionOrSize: '6', unit: 'ml', price: base, mrp: mrp ? Number(mrp) : Math.round(base * 1.3), stock: 25 },
      { id: `var-12ml-${Date.now()}`, label: '12ml', dimensionOrSize: '12', unit: 'ml', price: Math.round(base * 1.8), mrp: Math.round(base * 2.3), stock: 20 },
      { id: `var-50ml-${Date.now()}`, label: '50ml (Spray)', dimensionOrSize: '50', unit: 'ml', price: Math.round(base * 4.5), mrp: Math.round(base * 5.5), stock: 10 },
    ]);
  };

  const loadQuranPresets = () => {
    setUnitType('cm');
    const base = Number(price) || 350;
    setVariants([
      { id: `var-q-pocket-${Date.now()}`, label: 'Pocket (10x14 cm)', dimensionOrSize: '10x14', unit: 'cm', price: base, mrp: Math.round(base * 1.25), stock: 20 },
      { id: `var-q-medium-${Date.now()}`, label: 'Medium (14x20 cm)', dimensionOrSize: '14x20', unit: 'cm', price: Math.round(base * 1.7), mrp: Math.round(base * 2.1), stock: 30 },
      { id: `var-q-large-${Date.now()}`, label: 'Large (18x25 cm)', dimensionOrSize: '18x25', unit: 'cm', price: Math.round(base * 2.5), mrp: Math.round(base * 3.1), stock: 15 },
      { id: `var-q-jumbo-${Date.now()}`, label: 'Deluxe Jumbo (20x28 cm)', dimensionOrSize: '20x28', unit: 'cm', price: Math.round(base * 3.8), mrp: Math.round(base * 4.8), stock: 8 },
    ]);
  };

  const loadWeightPresets = () => {
    setUnitType('g');
    const base = Number(price) || 500;
    setVariants([
      { id: `var-w-12g-${Date.now()}`, label: '12 grams', dimensionOrSize: '12', unit: 'g', price: base, mrp: Math.round(base * 1.25), stock: 15 },
      { id: `var-w-25g-${Date.now()}`, label: '25 grams', dimensionOrSize: '25', unit: 'g', price: Math.round(base * 1.9), mrp: Math.round(base * 2.3), stock: 20 },
      { id: `var-w-50g-${Date.now()}`, label: '50 grams', dimensionOrSize: '50', unit: 'g', price: Math.round(base * 3.6), mrp: Math.round(base * 4.2), stock: 10 },
      { id: `var-w-100g-${Date.now()}`, label: '100 grams', dimensionOrSize: '100', unit: 'g', price: Math.round(base * 6.8), mrp: Math.round(base * 8.0), stock: 5 },
    ]);
  };

  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      {
        id: `var-${Date.now()}`,
        label: unitType === 'cm' ? 'Medium (14x20 cm)' : unitType === 'g' ? '25g' : '6ml',
        dimensionOrSize: '',
        unit: unitType,
        price: Number(price) || 499,
        mrp: mrp ? Number(mrp) : null,
        stock: 10,
      },
    ]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success && Array.isArray(json.urls)) {
        setImages(prev => [...prev.filter(img => img !== '/images/hero-perfume.jpg'), ...json.urls]);
      } else {
        setErrorMsg(json.error || 'Failed to upload images');
      }
    } catch {
      setErrorMsg('Image upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const totalStockSum = variants.length > 0
        ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : Number(stock);

      const payload = {
        name,
        slug,
        description,
        category,
        price: Number(price),
        mrp: mrp ? Number(mrp) : undefined,
        stock: totalStockSum,
        images: images.length > 0 ? images : ['/images/hero-perfume.jpg'],
        isActive,
        isBestSeller,
        isNewArrival,
        taxRate: Number(taxRate),
        hsnCode,
        unitType,
        variants: variants.length > 0 ? variants : null,
      };

      const url = isEdit ? `/api/admin/products/${initialData?.id}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setToastMsg('Product saved successfully!');
        setTimeout(() => {
          router.push(`${basePath}/products`);
          router.refresh();
        }, 800);
      } else {
        setErrorMsg(json.error || 'Failed to save product');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg('Network error while saving product');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#1E6B5C] text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#7A5B37] mb-1 flex items-center gap-2">
            <Link href={`${basePath}/products`} className="hover:underline">Products</Link>
            <span>/</span>
            <span className="font-semibold text-[#1E6B5C]">{isEdit ? 'Edit Product' : 'Add New Product'}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">
            {isEdit ? `Edit: ${initialData?.name}` : 'Create New Product'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}/products`}
            className="bg-white border border-[#E8DCC8] text-[#553E23] px-4 py-2 rounded-lg text-xs font-bold transition hover:bg-[#FFF8EC]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-6 py-2 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details (2 spans) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DCC8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#553E23] border-b border-[#E8DCC8] pb-2">
              Basic Product Information
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Royal Dehn Al Oud"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:ring-2 focus:ring-[#1E6B5C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. royal-dehn-al-oud"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-xs font-mono focus:ring-2 focus:ring-[#1E6B5C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detailed olfactory notes, provenance, distillation technique or book overview..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:ring-2 focus:ring-[#1E6B5C] outline-none"
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DCC8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#553E23] border-b border-[#E8DCC8] pb-2">
              Pricing, Inventory & Tax
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="2450"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm font-bold text-[#1E6B5C] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  MRP / Strike-through (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={mrp}
                  onChange={e => setMrp(e.target.value)}
                  placeholder="2999"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  Stock Quantity (Units) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="25"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  GST Tax Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={28}
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  placeholder="18"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={e => setHSNCode(e.target.value)}
                  placeholder="3303"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dimensions, Volumes & Custom Sizes */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DCC8] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DCC8] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#553E23] flex items-center gap-2">
                  <span>📏</span>
                  <span>Dimensions, Sizes & Volume Customizer</span>
                </h3>
                <p className="text-xs text-[#7A5B37] mt-0.5">
                  Configure perfume ml bottles, Holy Quran cm dimensions, or custom weight & stock options.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1E6B5C]/10 text-[#1E6B5C] self-start sm:self-auto">
                {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'} active
              </span>
            </div>

            {/* Dimension / Unit Selector */}
            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-2">
                Choose Dimension / Unit Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUnitType('ml')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    unitType === 'ml'
                      ? 'border-[#1E6B5C] bg-[#1E6B5C] text-white shadow-sm'
                      : 'border-[#E8DCC8] bg-[#FFF8EC]/40 text-[#553E23] hover:border-[#1E6B5C]/60'
                  }`}
                >
                  <span>🧴</span>
                  <span>Volume (ml)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUnitType('cm')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    unitType === 'cm'
                      ? 'border-[#1E6B5C] bg-[#1E6B5C] text-white shadow-sm'
                      : 'border-[#E8DCC8] bg-[#FFF8EC]/40 text-[#553E23] hover:border-[#1E6B5C]/60'
                  }`}
                >
                  <span>📖</span>
                  <span>Dimensions (cm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUnitType('g')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    unitType === 'g'
                      ? 'border-[#1E6B5C] bg-[#1E6B5C] text-white shadow-sm'
                      : 'border-[#E8DCC8] bg-[#FFF8EC]/40 text-[#553E23] hover:border-[#1E6B5C]/60'
                  }`}
                >
                  <span>⚖️</span>
                  <span>Weight (grams)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUnitType('size')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    unitType === 'size'
                      ? 'border-[#1E6B5C] bg-[#1E6B5C] text-white shadow-sm'
                      : 'border-[#E8DCC8] bg-[#FFF8EC]/40 text-[#553E23] hover:border-[#1E6B5C]/60'
                  }`}
                >
                  <span>🏷️</span>
                  <span>Custom / Size</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="bg-[#FFF8EC]/60 border border-[#E8DCC8] rounded-xl p-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#7A5B37] mr-1">One-Click Presets:</span>
              <button
                type="button"
                onClick={loadPerfumePresets}
                className="text-xs bg-white border border-[#E8DCC8] hover:border-[#1E6B5C] text-[#553E23] hover:text-[#1E6B5C] px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-2xs"
              >
                🧴 Perfume ml (3ml, 6ml, 12ml, 50ml)
              </button>
              <button
                type="button"
                onClick={loadQuranPresets}
                className="text-xs bg-white border border-[#E8DCC8] hover:border-[#1E6B5C] text-[#553E23] hover:text-[#1E6B5C] px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-2xs"
              >
                📖 Holy Quran cm (Pocket 10x14cm, Medium 14x20cm, Large 18x25cm)
              </button>
              <button
                type="button"
                onClick={loadWeightPresets}
                className="text-xs bg-white border border-[#E8DCC8] hover:border-[#1E6B5C] text-[#553E23] hover:text-[#1E6B5C] px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shadow-2xs"
              >
                ⚖️ Weight g (12g, 25g, 50g, 100g)
              </button>
            </div>

            {/* Variants Table */}
            <div className="space-y-3">
              {variants.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-[#E8DCC8] rounded-xl bg-[#FFF8EC]/20">
                  <div className="text-xl mb-1">📦</div>
                  <p className="text-xs font-semibold text-[#553E23]">No custom sizes/dimensions added yet.</p>
                  <p className="text-[11px] text-[#7A5B37] mt-0.5">
                    This product will use the single default price (₹{price || 0}) and stock ({stock || 0}).
                  </p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="mt-3 bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    + Add Size / Dimension Option
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37] px-2">
                    <div className="col-span-4">Size / Dimension Label *</div>
                    <div className="col-span-3">Selling Price (₹) *</div>
                    <div className="col-span-2">MRP (₹)</div>
                    <div className="col-span-2">Stock (Qty) *</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>

                  {variants.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#FFF8EC]/30 border border-[#E8DCC8] p-3 rounded-xl items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="sm:hidden block text-[10px] font-bold text-[#7A5B37] uppercase mb-0.5">
                          Size / Dimension Label *
                        </label>
                        <input
                          type="text"
                          required
                          value={v.label}
                          onChange={e => updateVariant(idx, 'label', e.target.value)}
                          placeholder={unitType === 'cm' ? 'e.g. Medium (14x20 cm)' : unitType === 'g' ? 'e.g. 25g' : 'e.g. 12ml'}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E8DCC8] bg-white text-xs font-semibold text-[#553E23] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="sm:hidden block text-[10px] font-bold text-[#7A5B37] uppercase mb-0.5">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={v.price}
                          onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                          placeholder="499"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E8DCC8] bg-white text-xs font-bold text-[#1E6B5C] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] font-bold text-[#7A5B37] uppercase mb-0.5">
                          MRP (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={v.mrp ?? ''}
                          onChange={e => updateVariant(idx, 'mrp', e.target.value ? Number(e.target.value) : null)}
                          placeholder="699"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E8DCC8] bg-white text-xs text-[#7A5B37] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] font-bold text-[#7A5B37] uppercase mb-0.5">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={v.stock}
                          onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                          placeholder="10"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#E8DCC8] bg-white text-xs font-semibold text-[#553E23] focus:ring-2 focus:ring-[#1E6B5C] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-center pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition text-xs font-bold cursor-pointer"
                          title="Remove size option"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="bg-white border border-[#1E6B5C] text-[#1E6B5C] hover:bg-[#1E6B5C] hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+</span>
                      <span>Add Another Size / Dimension</span>
                    </button>

                    <div className="text-xs text-[#7A5B37] bg-[#FFF8EC] border border-[#E8DCC8] px-3 py-1.5 rounded-lg font-medium">
                      Total Stock across all sizes: <strong className="text-[#553E23]">{variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)} units</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Category & Images */}
        <div className="space-y-6">
          {/* Classification & Flags */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DCC8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#553E23] border-b border-[#E8DCC8] pb-2">
              Categorization
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#553E23] uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/30 text-sm font-semibold focus:ring-2 focus:ring-[#1E6B5C] outline-none text-[#553E23]"
              >
                <option value="attar">Attars & Perfumes</option>
                <option value="books">Islamic Books</option>
                <option value="gifts">Gift Sets & Tasbih</option>
                <option value="essentials">Essentials & Mabkhara</option>
              </select>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-[#1E6B5C] focus:ring-[#1E6B5C] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#553E23]">Active in Storefront</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={e => setIsBestSeller(e.target.checked)}
                  className="rounded text-[#1E6B5C] focus:ring-[#1E6B5C] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#553E23]">Feature in Best Sellers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={e => setIsNewArrival(e.target.checked)}
                  className="rounded text-[#1E6B5C] focus:ring-[#1E6B5C] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#553E23]">Tag as New Arrival</span>
              </label>
            </div>
          </div>

          {/* Images Upload */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DCC8] shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-[#553E23] border-b border-[#E8DCC8] pb-2">
              Product Images
            </h3>

            <div className="space-y-3">
              <label className="block border-2 border-dashed border-[#E8DCC8] hover:border-[#1E6B5C] rounded-xl p-4 text-center cursor-pointer transition bg-[#FFF8EC]/20">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs font-bold text-[#1E6B5C]">
                  {isUploading ? 'Uploading to Storage...' : 'Upload Photos'}
                </div>
                <div className="text-[10px] text-[#7A5B37] mt-0.5">
                  Multi-upload to Supabase Storage
                </div>
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {images.map((imgUrl, i) => (
                    <div key={i} className="relative aspect-square rounded-lg border border-[#E8DCC8] overflow-hidden group">
                      <img
                        src={imgUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
