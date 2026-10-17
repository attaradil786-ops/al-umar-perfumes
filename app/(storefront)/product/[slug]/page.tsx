import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });

  if (!product) {
    return {
      title: 'Product Not Found | Al Umar',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumarperfumes.com';
  const ogImageUrl = product.images[0] || `${siteUrl}/images/hero-perfume.jpg`;

  return {
    title: `${product.name} | Al Umar Artisanal Perfumes`,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: `${siteUrl}/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Al Umar Artisanal Perfumes`,
      description: product.description.slice(0, 160),
      url: `${siteUrl}/product/${product.slug}`,
      siteName: 'Al Umar Perfumes',
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'article',
    },
    other: {
      'og:type': 'product',
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'INR',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alumarperfumes.com';

  // Schema.org Product JSON-LD
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.length > 0 ? product.images : [`${siteUrl}/images/hero-perfume.jpg`],
    description: product.description,
    sku: product.id,
    mpn: product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Al Umar Perfumes',
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Al Umar Perfumes',
      },
    },
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
  };

  // Related products from the same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id },
      isActive: true,
    },
    take: 4,
  });

  const formattedProduct = {
    ...product,
    reviews: product.reviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <main className="min-h-screen bg-[#FFF8EC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient product={formattedProduct} relatedProducts={relatedProducts} />
    </main>
  );
}
