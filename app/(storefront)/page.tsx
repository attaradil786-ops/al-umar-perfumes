import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, getSiteContent } from '@/lib/api';
import OfferBanner from '@/components/OfferBanner';

export const revalidate = 60; // ISR cache every minute

export const metadata: Metadata = {
  title: 'Al Umar Perfumes | Pure Attars, Cambodian Oud & Islamic Literature',
  description:
    'Discover authentic hand-blended attars, pure Cambodian Dehn Al Oud, White Musk, prayer tasbihs, and classical Islamic books with express delivery across India.',
  alternates: {
    canonical: 'https://alumarperfumes.com',
  },
  openGraph: {
    title: 'Al Umar Perfumes | Pure Attars & Cambodian Oud',
    description:
      'Curating the finest oriental fragrances, pure Cambodian Oud oil, Taif rose extracts, and inspiring Islamic texts to enrich your spiritual lifestyle.',
    url: 'https://alumarperfumes.com',
    siteName: 'Al Umar Perfumes',
    type: 'website',
  },
};

export default async function HomePage() {
  const [bestSellers, newArrivals, heroTitle, heroSubtitle] = await Promise.all([
    getProducts({ bestSeller: true, limit: 8 }),
    getProducts({ newArrival: true, limit: 8 }),
    getSiteContent('hero_title', 'Pure & Natural Essential Oils'),
    getSiteContent(
      'hero_subtitle',
      'Experience the power of nature with our premium botanical essential oils. Carefully sourced and crafted to bring purity, relaxation and wellness.'
    ),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumarperfumes.com';

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Al Umar Perfumes',
    url: siteUrl,
    logo: `${siteUrl}/images/cat-oud.jpg`,
    description:
      'Artisanal perfumery specializing in pure Cambodian Dehn Al Oud, Indian Attars, musk oils, and classical Islamic literature.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mumbai',
      addressRegion: 'Maharashtra',
      postalCode: '400001',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 98765 43210',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi', 'Urdu'],
    },
    sameAs: ['https://instagram.com/alumarperfumes'],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Categories Horizontal Bar */}
      <section className="category-strip">
        <div className="container">
          <div className="category-scroll">
            <Link href="/collections?category=attar" className="category-pill">
              <div className="category-thumb-box">
                <img src="/images/cat-oud.jpg" alt="Premium Oud" />
              </div>
              <span className="category-title">Premium Oud</span>
            </Link>
            <Link href="/collections?category=attar" className="category-pill">
              <div className="category-thumb-box">
                <img src="/images/cat-musk.jpg" alt="White Musk" />
              </div>
              <span className="category-title">White Musk</span>
            </Link>
            <Link href="/collections?category=attar" className="category-pill">
              <div className="category-thumb-box">
                <img src="/images/cat-floral.jpg" alt="Floral Attars" />
              </div>
              <span className="category-title">Floral Attars</span>
            </Link>
            <Link href="/collections?category=gifts" className="category-pill">
              <div className="category-thumb-box">
                <img src="/images/cat-gifts.jpg" alt="Gift Sets" />
              </div>
              <span className="category-title">Gift Sets</span>
            </Link>
            <Link href="/collections?category=books" className="category-pill">
              <div className="category-thumb-box">
                <img src="/images/quran-translation.jpg" alt="Islamic Books" />
              </div>
              <span className="category-title">Islamic Books</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: "url('/images/hero-perfume.jpg')" }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{heroTitle}</h1>
          <p className="hero-desc">{heroSubtitle}</p>
          <a href="#shop-section" className="btn-primary">Shop Now</a>
        </div>
      </section>

      {/* Active Hero Offer Overlay */}
      <OfferBanner placement="hero" />

      {/* Best Sellers Section */}
      <section id="shop-section" className="section-padding">
        <div className="container">
          <div className="section-header">
            <div className="stars-rating">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div className="social-proof">
              <div className="avatar-stack">
                <img src="https://i.pravatar.cc/100?img=1" alt="Reviewer" />
                <img src="https://i.pravatar.cc/100?img=2" alt="Reviewer" />
                <img src="https://i.pravatar.cc/100?img=3" alt="Reviewer" />
                <img src="https://i.pravatar.cc/100?img=4" alt="Reviewer" />
                <img src="https://i.pravatar.cc/100?img=5" alt="Reviewer" />
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: '#553E23' }}>
                Loved by our growing community
              </p>
            </div>
            <h2 className="section-title">Best Sellers</h2>
          </div>

          <div className="products-grid">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/best-sellers" className="btn-green">View All Best Sellers</Link>
          </div>
        </div>
      </section>

      {/* Secondary Banner */}
      <section className="secondary-banner" style={{ backgroundImage: "url('/images/secondary-banner.jpg')" }}>
        <div className="secondary-banner-overlay"></div>
        <h2 className="secondary-banner-title">Premium Handcrafted Attars</h2>
      </section>

      {/* New Arrivals Section */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">New Arrivals</h2>
          </div>
          <div className="products-grid">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/new-arrivals" className="btn-green">View All New Arrivals</Link>
          </div>
        </div>
      </section>

      {/* Shop By Category Grid */}
      <section className="section-padding" style={{ backgroundColor: 'rgba(232, 220, 200, 0.25)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop By Category</h2>
          </div>
          <div className="category-card-grid">
            <Link href="/collections?category=attar" className="category-visual-card">
              <img src="/images/cat-oud.jpg" alt="Premium Oud" />
              <div className="category-visual-overlay">
                <span className="category-visual-title">Premium Oud</span>
              </div>
            </Link>
            <Link href="/collections?category=attar" className="category-visual-card">
              <img src="/images/cat-musk.jpg" alt="White Musk" />
              <div className="category-visual-overlay">
                <span className="category-visual-title">White Musk</span>
              </div>
            </Link>
            <Link href="/collections?category=attar" className="category-visual-card">
              <img src="/images/cat-floral.jpg" alt="Floral Attars" />
              <div className="category-visual-overlay">
                <span className="category-visual-title">Floral Attars</span>
              </div>
            </Link>
            <Link href="/collections?category=gifts" className="category-visual-card">
              <img src="/images/cat-gifts.jpg" alt="Gift Sets" />
              <div className="category-visual-overlay">
                <span className="category-visual-title">Gift Sets</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Loved by Our Customers</h2>
          </div>
          <div className="reviews-grid">
            <div className="review-card">
              <div className="stars-rating" style={{ justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                ★★★★★
              </div>
              <p className="review-text">&ldquo;The best attar I have ever used. Long lasting and completely natural Cambodian notes.&rdquo;</p>
              <div className="reviewer-name">- Ahmed M., Mumbai</div>
            </div>
            <div className="review-card">
              <div className="stars-rating" style={{ justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                ★★★★★
              </div>
              <p className="review-text">&ldquo;Absolutely love the packaging and the scent. Fast delivery and pure quality!&rdquo;</p>
              <div className="reviewer-name">- Sara K., Bangalore</div>
            </div>
            <div className="review-card">
              <div className="stars-rating" style={{ justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                ★★★★★
              </div>
              <p className="review-text">&ldquo;Premium quality stuff. The oud is deeply authentic and stays on clothes for over 24 hours.&rdquo;</p>
              <div className="reviewer-name">- Zaid A., Hyderabad</div>
            </div>
            <div className="review-card">
              <div className="stars-rating" style={{ justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
                ★★★★★
              </div>
              <p className="review-text">&ldquo;Highly recommend the gift sets and Islamic books. Exquisite presentation.&rdquo;</p>
              <div className="reviewer-name">- Fatima R., Delhi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Us</h2>
          </div>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h3 className="feature-title">Premium Quality</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
              </div>
              <h3 className="feature-title">Organic Herbs</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h3 className="feature-title">Long Lasting</h3>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <h3 className="feature-title">Secure Payments</h3>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
