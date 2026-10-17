import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const dataToUpdate: Prisma.CouponUpdateInput = {};
    if (body.code !== undefined && body.code.trim()) {
      dataToUpdate.code = body.code.trim().toUpperCase();
    }
    if (body.type !== undefined) {
      const typeUpper = (body.type || '').toUpperCase();
      if (typeUpper === 'FLAT') dataToUpdate.type = 'FLAT';
      else if (typeUpper === 'FREE_SHIPPING' || typeUpper === 'FREESHIPPING') dataToUpdate.type = 'FREE_SHIPPING';
      else dataToUpdate.type = 'PERCENTAGE';
    }
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.value !== undefined) dataToUpdate.value = Number(body.value);
    if (body.minOrder !== undefined) dataToUpdate.minOrder = Number(body.minOrder);
    if (body.maxUses !== undefined) dataToUpdate.maxUses = body.maxUses ? Number(body.maxUses) : null;
    if (body.expiresAt !== undefined) dataToUpdate.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const updated = await prisma.coupon.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, message: 'Coupon updated successfully', coupon: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Soft delete via isActive=false as required in prompt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    // Perform soft-delete by deactivating coupon
    const disabledCoupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: `Coupon "${disabledCoupon.code}" disabled successfully (soft deleted)`,
      coupon: disabledCoupon,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
