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

    const dataToUpdate: Prisma.OfferUpdateInput = {};
    if (body.title !== undefined) dataToUpdate.title = body.title.trim();
    if (body.description !== undefined) dataToUpdate.description = body.description.trim();
    if (body.code !== undefined) dataToUpdate.code = body.code ? body.code.trim().toUpperCase() : null;
    if (body.bannerImage !== undefined) dataToUpdate.bannerImage = body.bannerImage ? body.bannerImage.trim() : null;
    if (body.placement !== undefined) dataToUpdate.placement = body.placement;
    if (body.startsAt !== undefined) dataToUpdate.startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    if (body.endsAt !== undefined) dataToUpdate.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.position !== undefined) dataToUpdate.position = Number(body.position) || 0;

    const updated = await prisma.offer.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, message: 'Offer updated successfully', offer: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update offer';
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
    await prisma.offer.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete offer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
