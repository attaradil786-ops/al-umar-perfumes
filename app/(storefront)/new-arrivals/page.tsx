import React from 'react';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/api';

export const revalidate = 60;

export default async function NewArrivalsPage() {
  const products = await getProducts({ newArrival: true });

  return (
    <main className="container section-padding">
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="section-title">New Arrivals</h1>
        <p style={{ color: '#6B5E50', marginTop: '0.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Recently distilled batches of artisan attars, newly published Islamic literature, and hand-carved jade & olive wood tasbihs.
        </p>
      </div>

      <div className="products-grid" id="new-arrivals-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
