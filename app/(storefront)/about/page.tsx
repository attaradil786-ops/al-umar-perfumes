import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteContent } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Our Heritage & Craft | Al Umar Artisanal Perfumes',
  description:
    'Learn about Al Umar Perfumes: rooted in Middle Eastern distillation mastery, pure Cambodian Dehn Al Oud, and authentic Islamic heritage since inception.',
  openGraph: {
    title: 'Our Heritage & Craft | Al Umar Artisanal Perfumes',
    description:
      'Discover the artisanal ethos behind Al Umar Perfumes, pure botanical distillations, and timeless Islamic fragrance heritage.',
    url: 'https://alumarperfumes.com/about',
  },
};

export default async function AboutPage() {
  const customAboutContent = await getSiteContent('about_content');

  return (
    <main className="container-narrow section-padding">
      <h1 className="section-title" style={{ marginBottom: '1.5rem', color: '#1E6B5C' }}>About Us</h1>
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', lineHeight: 1.8, color: '#4A3F33' }}>
        {customAboutContent ? (
          <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            {customAboutContent}
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Our Heritage &amp; Craft
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Welcome to <strong>Al Umar Perfumes</strong>. Rooted in traditional Middle Eastern distillation mastery and timeless Islamic heritage, our mission is to offer purity, reverence, and sensory tranquility to your daily life.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Every bottle of Dehn Al Oud, White Musk, and floral concentrate is extracted without synthetic fillers or harsh alcohols, using age-old steam distillation and traditional aging techniques that preserve the authentic depth of rare botanical ingredients.
            </p>
            
            <h2 style={{ fontFamily: 'var(--font-luxury)', color: '#553E23', fontSize: '1.5rem', margin: '2rem 0 1rem' }}>
              Enriching the Soul
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Beyond our renowned fragrance oils, we curate essential Islamic literature — foundational tafsir, uplifting spiritual guidance by classic and modern scholars, and artisan tasbih prayer beads hand-carved from sacred olive wood, natural clay, and white jade.
            </p>
          </>
        )}

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #E8DCC8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#1E6B5C' }}>Al Umar Artisans</div>
            <div style={{ fontSize: '0.85rem', color: '#7A5B37' }}>Pure Oriental Fragrances &amp; Books</div>
          </div>
          <Link href="/collections" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
            Explore Collection
          </Link>
        </div>
      </div>
    </main>
  );
}
