import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code, subtotal, shipping = 100, phone, email } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Please enter a valid coupon code' },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive || coupon.value <= 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or inactive coupon code' },
        { status: 404 }
      );
    }

    // Check expiration
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'This coupon code has expired' },
        { status: 400 }
      );
    }

    // Check usage limits
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: 'Coupon usage limit has been reached' },
        { status: 400 }
      );
    }

    const orderSubtotal = Number(subtotal);
    if (isNaN(orderSubtotal) || orderSubtotal <= 0) {
      return NextResponse.json(
        { valid: false, error: 'Subtotal must be a positive number to apply a coupon.' },
        { status: 400 }
      );
    }

    // Check minimum order requirement
    if (orderSubtotal < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order value of ₹${coupon.minOrder.toLocaleString('en-IN')} required for this coupon`,
        },
        { status: 400 }
      );
    }

    // Check if user has already used this coupon on an existing order (1 coupon per user rule)
    if (phone || email) {
      const cleanPhone = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
      const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '';
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

      const orConditions: any[] = [];
      if (cleanPhone10) {
        orConditions.push({ phone: { contains: cleanPhone10 } });
      }
      if (cleanEmail) {
        orConditions.push({ email: { equals: cleanEmail, mode: 'insensitive' } });
      }

      if (orConditions.length > 0) {
        const priorOrder = await prisma.order.findFirst({
          where: {
            couponCode: cleanCode,
            status: { not: 'Cancelled' },
            OR: orConditions,
          },
        });

        if (priorOrder) {
          return NextResponse.json(
            {
              valid: false,
              error: 'You have already redeemed this coupon code on a previous order. Each customer may use a coupon code only once.',
            },
            { status: 400 }
          );
        }
      }
    }

    // Calculate discount based on coupon type
    let discount = 0;
    const typeUpper = (coupon.type || '').toUpperCase();

    if (typeUpper === 'PERCENTAGE' || typeUpper === 'PERCENT') {
      // subtotal * value / 100 capped at 100% of subtotal
      const rawPercent = Math.min(100, Math.max(0, coupon.value));
      discount = Math.min(orderSubtotal, Math.round((orderSubtotal * rawPercent) / 100));
    } else if (typeUpper === 'FREE_SHIPPING' || typeUpper === 'FREESHIPPING') {
      // free_shipping → discount equals current shipping charge
      const standardShipping = orderSubtotal >= 1500 ? 0 : Number(shipping) || 100;
      discount = standardShipping;
    } else {
      // Flat discount capped at subtotal
      discount = Math.min(coupon.value, orderSubtotal);
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      minOrder: coupon.minOrder,
      message:
        typeUpper === 'FREE_SHIPPING'
          ? `Coupon ${coupon.code} applied! Free Shipping activated.`
          : `Coupon ${coupon.code} applied! Saved ₹${discount.toLocaleString('en-IN')}`,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
