import React from 'react';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/api';

export const revalidate = 60;

export default async function BestSellersPage() {
  const products = await getProducts({ bestSeller: true });

  return (
    <main className="container section-padding">
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="section-title">Best Sellers</h1>
        <p style={{ color: '#6B5E50', marginTop: '0.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Our most beloved fragrances, purest Cambodian Oud, and sought-after Islamic literary classics rated 4.7+ by customers nationwide.
        </p>
      </div>

      <div className="products-grid" id="best-sellers-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
