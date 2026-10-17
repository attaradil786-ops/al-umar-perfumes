'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const basePath = `/${adminPath}`;

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
      const payload = {
        name,
        slug,
        description,
        category,
        price: Number(price),
        mrp: mrp ? Number(mrp) : undefined,
        stock: Number(stock),
        images: images.length > 0 ? images : ['/images/hero-perfume.jpg'],
        isActive,
        isBestSeller,
        isNewArrival,
        taxRate: Number(taxRate),
        hsnCode,
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
                onChange={e => setCategory(e.target.value)}
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
