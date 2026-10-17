import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({
        valid: true,
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        warnings: [],
      });
    }

    const productIds = items.map((i: any) => i.id || i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    const warnings: string[] = [];
    const validatedItems: any[] = [];

    for (const item of items) {
      const id = item.id || item.productId;
      const dbProduct = productMap.get(id);

      if (!dbProduct) {
        warnings.push(`"${item.name || 'An item'}" is currently unavailable and has been removed from your cart.`);
        continue;
      }

      let quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (dbProduct.stock <= 0) {
        warnings.push(`"${dbProduct.name}" is currently out of stock.`);
        continue;
      } else if (quantity > dbProduct.stock) {
        warnings.push(`Only ${dbProduct.stock} units of "${dbProduct.name}" are currently available in stock. Quantity adjusted.`);
        quantity = dbProduct.stock;
      }

      // Server-side trusted price calculation strictly from DB
      let unitPrice = dbProduct.price;
      const opt = typeof (item.size || item.option) === 'string' ? (item.size || item.option).trim() : '6ml';
      if (opt.toLowerCase().includes('12ml')) {
        unitPrice = Math.round(dbProduct.price * 1.8);
      }
      unitPrice = Math.max(dbProduct.price, unitPrice);

      validatedItems.push({
        id: dbProduct.id,
        productId: dbProduct.id,
        name: dbProduct.name,
        price: unitPrice,
        basePrice: dbProduct.price,
        image_url: dbProduct.images?.[0] || item.image_url || '/images/hero-perfume.jpg',
        category: dbProduct.category,
        size: item.size || item.option || '6ml',
        option: item.option || item.size || '6ml',
        quantity,
      });
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 1500 || validatedItems.length === 0 ? 0 : 100;
    const total = subtotal + shipping;

    return NextResponse.json({
      valid: warnings.length === 0,
      items: validatedItems,
      subtotal,
      shipping,
      total,
      warnings,
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate cart with server.' },
      { status: 500 }
    );
  }
}
