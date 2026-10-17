'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  mrp?: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  rating: number;
}

export default function AdminProductsPage({
  params,
}: {
  params: { adminPath: string };
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const basePath = `/${params.adminPath}`;

  const fetchProducts = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('q', search);
    if (category && category !== 'all') query.set('category', category);

    fetch(`/api/admin/products?${query.toString()}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setProducts(res.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert(json.error || 'Failed to delete product');
      }
    } catch {
      alert('Error occurred while deleting product.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">
            Products Inventory
          </h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Manage your signature attars, books, and essential collections
          </p>
        </div>

        <Link
          href={`${basePath}/products/new`}
          className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DCC8] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or description..."
            className="w-full px-3.5 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/40 text-xs focus:ring-2 focus:ring-[#1E6B5C] outline-none"
          />
          <button
            type="submit"
            className="bg-[#553E23] hover:bg-[#7A5B37] text-white px-4 py-2 rounded-lg text-xs font-bold transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-[#7A5B37] font-semibold">Category:</span>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E8DCC8] bg-[#FFF8EC]/40 text-xs font-semibold focus:ring-2 focus:ring-[#1E6B5C] outline-none text-[#553E23]"
          >
            <option value="all">All Categories</option>
            <option value="attar">Attars & Perfumes</option>
            <option value="books">Islamic Books</option>
            <option value="gifts">Gift Sets & Tasbih</option>
            <option value="essentials">Essentials</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E8DCC8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8DCC8] bg-[#FFF8EC]/60 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37]">
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[#7A5B37]">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-[#7A5B37]">
                    No products matched your criteria.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const isLowStock = product.stock < 10;
                  const thumb = product.images?.[0] || '/images/hero-perfume.jpg';

                  return (
                    <tr key={product.id} className="hover:bg-[#FFF8EC]/30 transition">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-lg bg-[#F8F4EC] border border-[#E8DCC8] overflow-hidden flex items-center justify-center">
                          <img
                            src={thumb}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).src = '/images/hero-perfume.jpg';
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#121212]">{product.name}</div>
                        <div className="text-[11px] text-[#7A5B37] font-mono">{product.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FFF8EC] border border-[#E8DCC8] text-[#553E23]">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#553E23]">
                        {formatPrice(product.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                            isLowStock
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            product.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`${basePath}/products/${product.id}`}
                            className="bg-[#FFF8EC] hover:bg-[#F2E8D7] text-[#1E6B5C] border border-[#E8DCC8] px-2.5 py-1 rounded text-xs font-bold transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-bold transition disabled:opacity-50"
                          >
                            {deletingId === product.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
