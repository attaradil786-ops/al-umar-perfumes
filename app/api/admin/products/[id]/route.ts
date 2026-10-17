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
    if (body.price !== undefined) dataToUpdate.price = Number(body.price);
    if (body.mrp !== undefined) dataToUpdate.mrp = Number(body.mrp);
    if (body.stock !== undefined) dataToUpdate.stock = Number(body.stock);
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
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
