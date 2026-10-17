import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface ProductType {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  mrp: number | null;
  stock: number;
  images: string[];
  image_url?: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  taxRate: number;
  hsnCode: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GetProductsOptions {
  category?: string;
  sort?: 'price-low' | 'price-high' | 'rating' | 'newest' | 'featured' | string;
  search?: string;
  q?: string;
  bestSeller?: boolean;
  isBestSeller?: boolean;
  newArrival?: boolean;
  isNewArrival?: boolean;
  limit?: number;
  page?: number;
}

/**
 * Fetch products from the database with filtering and sorting
 */
export async function getProducts(options: GetProductsOptions = {}): Promise<ProductType[]> {
  try {
    const { category, sort, search, q, bestSeller, isBestSeller, newArrival, isNewArrival, limit, page } = options;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (category && category !== 'all') {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    const searchQuery = search || q;
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { description: { contains: searchQuery.trim(), mode: 'insensitive' } },
      ];
    }

    if (bestSeller !== undefined || isBestSeller !== undefined) {
      where.isBestSeller = Boolean(bestSeller ?? isBestSeller);
    }

    if (newArrival !== undefined || isNewArrival !== undefined) {
      where.isNewArrival = Boolean(newArrival ?? isNewArrival);
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const take = limit && limit > 0 ? limit : undefined;
    const skip = page && page > 1 && limit ? (page - 1) * limit : undefined;

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take,
      skip,
    });

    return products.map(p => ({
      ...p,
      image_url: p.images?.[0] || '/images/hero-perfume.jpg',
    }));
  } catch (error) {
    console.error('getProducts error:', error);
    return [];
  }
}

/**
 * Fetch a single product by slug or id
 */
export async function getProduct(slug: string): Promise<ProductType | null> {
  try {
    if (!slug) return null;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true,
      },
      include: {
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) return null;

    return {
      ...product,
      image_url: product.images?.[0] || '/images/hero-perfume.jpg',
    };
  } catch (error) {
    console.error(`getProduct(${slug}) error:`, error);
    return null;
  }
}

/**
 * Fetch site content value by key with optional fallback
 */
export async function getSiteContent(key: string, defaultValue: string = ''): Promise<string> {
  try {
    if (!key) return defaultValue;

    const content = await prisma.siteContent.findUnique({
      where: { key },
    });

    return content?.value || defaultValue;
  } catch (error) {
    console.error(`getSiteContent(${key}) error:`, error);
    return defaultValue;
  }
}
