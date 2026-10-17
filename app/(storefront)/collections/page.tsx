import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Artisanal Perfume Collections | Al Umar',
  description:
    'Explore our curated collections of pure Cambodian Dehn Al Oud, White Musk, floral attars, luxury gift sets, and classical Islamic texts.',
  openGraph: {
    title: 'Artisanal Perfume Collections | Al Umar',
    description:
      'Explore our curated collections of pure Cambodian Dehn Al Oud, White Musk, floral attars, luxury gift sets, and classical Islamic texts.',
    url: 'https://alumarperfumes.com/collections',
    type: 'website',
  },
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; q?: string };
}) {
  const selectedCategory = searchParams.category || 'all';
  const sort = searchParams.sort || 'featured';
  const q = searchParams.q || '';

  const products = await getProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    sort,
    search: q,
  });

  const categories = [
    { label: 'All Products', value: 'all' },
    { label: 'Attars & Oils', value: 'attar' },
    { label: 'Islamic Books', value: 'books' },
    { label: 'Gift Sets', value: 'gifts' },
    { label: 'Essentials', value: 'essentials' },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumarperfumes.com';
  const activeCatLabel = categories.find(c => c.value === selectedCategory)?.label || 'Collections';

  const breadcrumbListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Collections',
        item: `${siteUrl}/collections`,
      },
      ...(selectedCategory !== 'all'
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: activeCatLabel,
              item: `${siteUrl}/collections?category=${selectedCategory}`,
            },
          ]
        : []),
    ],
  };

  return (
    <main className="container section-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
      />
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
          All Collections
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
          <span id="catalog-count" style={{ color: '#7A5B37', fontSize: '0.95rem' }}>
            Showing {products.length} products
          </span>

          {/* Sort Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#553E23' }}>Sort By:</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link
                href={`/collections?category=${selectedCategory}&sort=featured`}
                className={`catalog-filter-pill ${sort === 'featured' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                Featured
              </Link>
              <Link
                href={`/collections?category=${selectedCategory}&sort=price-low`}
                className={`catalog-filter-pill ${sort === 'price-low' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/collections?category=${selectedCategory}&sort=price-high`}
                className={`catalog-filter-pill ${sort === 'price-high' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                Price: High to Low
              </Link>
              <Link
                href={`/collections?category=${selectedCategory}&sort=rating`}
                className={`catalog-filter-pill ${sort === 'rating' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
              >
                Rating
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <Link
              key={cat.value}
              href={`/collections?category=${cat.value}${sort !== 'featured' ? `&sort=${sort}` : ''}`}
              className={`catalog-filter-pill ${isActive ? 'active' : ''}`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#7A5B37' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No products found in this category.</p>
          <Link href="/collections" className="btn-primary">
            View All Products
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
