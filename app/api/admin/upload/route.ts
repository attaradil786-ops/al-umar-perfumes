import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

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
      // 1. File Size Validation (Max 5MB)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the maximum allowed size of 5MB.` },
          { status: 400 }
        );
      }

      // 2. Strict MIME Type Whitelist
      const mimeType = (file.type || '').toLowerCase();
      const ext = ALLOWED_MIME_TYPES[mimeType];

      if (!ext) {
        return NextResponse.json(
          { error: `Invalid file type "${file.type}". Only JPG, PNG, and WebP images are permitted.` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // 3. Verify magic bytes for extra security against spoofed Content-Type
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

      if (!isJpeg && !isPng && !isWebp) {
        return NextResponse.json(
          { error: 'File signature does not match an authentic image format.' },
          { status: 400 }
        );
      }

      // 4. Secure Random Filename (Ignore original name)
      const safeName = `${crypto.randomUUID()}${ext}`;

      if (isSupabaseConfigured) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.storage
            .from('products')
            .upload(safeName, buffer, {
              contentType: mimeType,
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

      // Local fallback in public/images/uploads (strictly sanitized)
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
