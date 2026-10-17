import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured =
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes('your-project') &&
      !supabaseKey.includes('placeholder');

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || '.jpg';
      const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;

      if (isSupabaseConfigured) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.storage
            .from('products')
            .upload(safeName, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true,
            });

          if (!error && data) {
            const { data: publicData } = supabase.storage
              .from('products')
              .getPublicUrl(safeName);
            uploadedUrls.push(publicData.publicUrl);
            continue;
          }
        } catch (supabaseErr) {
          console.warn('Supabase upload attempt failed, falling back to local storage:', supabaseErr);
        }
      }

      // Local fallback in public/images/
      const localDir = path.join(process.cwd(), 'public', 'images', 'uploads');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(localDir, safeName);
      fs.writeFileSync(localPath, buffer);
      uploadedUrls.push(`/images/uploads/${safeName}`);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
