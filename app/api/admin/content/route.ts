import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contents = await prisma.siteContent.findMany();
    // Also build a convenient key-value map
    const contentMap: Record<string, string> = {};
    for (const c of contents) {
      contentMap[c.key] = c.value;
    }

    return NextResponse.json({ success: true, contents, contentMap });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch site content';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Support single { key, value } or multiple entries
    if (body.key && body.value !== undefined) {
      const updated = await prisma.siteContent.upsert({
        where: { key: body.key },
        update: { value: String(body.value) },
        create: { key: body.key, value: String(body.value) },
      });
      return NextResponse.json({ success: true, content: updated });
    }

    // Support array of items: { items: [{ key, value }] }
    if (Array.isArray(body.items)) {
      const results = [];
      for (const item of body.items) {
        if (item.key && item.value !== undefined) {
          const res = await prisma.siteContent.upsert({
            where: { key: item.key },
            update: { value: String(item.value) },
            create: { key: item.key, value: String(item.value) },
          });
          results.push(res);
        }
      }
      return NextResponse.json({ success: true, count: results.length, contents: results });
    }

    // Support dictionary object { [key]: value }
    const entries = Object.entries(body).filter(([k]) => k !== 'key' && k !== 'value');
    if (entries.length > 0) {
      const results = [];
      for (const [k, v] of entries) {
        if (typeof v === 'string' || typeof v === 'number') {
          const res = await prisma.siteContent.upsert({
            where: { key: k },
            update: { value: String(v) },
            create: { key: k, value: String(v) },
          });
          results.push(res);
        }
      }
      return NextResponse.json({ success: true, count: results.length, contents: results });
    }

    return NextResponse.json({ error: 'No valid key-value data provided' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save site content';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PATCH(request);
}
