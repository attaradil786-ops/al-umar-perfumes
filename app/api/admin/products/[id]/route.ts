import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { reviews: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

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

    const dataToUpdate: Prisma.ProductUpdateInput = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.slug !== undefined) dataToUpdate.slug = body.slug.trim().toLowerCase();
    if (body.description !== undefined) dataToUpdate.description = body.description.trim();
    if (body.category !== undefined) dataToUpdate.category = body.category.toLowerCase().trim();
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 1) {
        return NextResponse.json({ error: 'Product price must be at least ₹1.' }, { status: 400 });
      }
      dataToUpdate.price = Math.round(p);
    }
    if (body.mrp !== undefined) {
      const m = Number(body.mrp);
      dataToUpdate.mrp = isNaN(m) ? null : Math.round(m);
    }
    if (body.stock !== undefined) {
      const s = Number(body.stock);
      if (isNaN(s) || s < 0) {
        return NextResponse.json({ error: 'Product stock cannot be negative.' }, { status: 400 });
      }
      dataToUpdate.stock = Math.round(s);
    }
    if (body.images !== undefined) dataToUpdate.images = body.images;
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.isBestSeller !== undefined) dataToUpdate.isBestSeller = Boolean(body.isBestSeller);
    if (body.isNewArrival !== undefined) dataToUpdate.isNewArrival = Boolean(body.isNewArrival);
    if (body.taxRate !== undefined) dataToUpdate.taxRate = Number(body.taxRate);
    if (body.hsnCode !== undefined) dataToUpdate.hsnCode = String(body.hsnCode);

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

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

    // Check if product is referenced in historical customer orders
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      // Soft-delete to preserve legal invoices and tax records
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Product is linked to historical customer orders. Deactivated (soft-deleted) to preserve order history.',
        softDeleted: true,
      });
    }

    // Hard-delete if no orders reference it
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
