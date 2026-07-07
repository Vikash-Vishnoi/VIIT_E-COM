import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getAdminUser } from '@/lib/auth';
import { AdminAuditLog } from '@/models';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const adminId = await getAdminUser(req);
    if (!adminId) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.' }, { status: 400 });
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ success: false, message: 'File is too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'e-com3/products' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
    await AdminAuditLog.create({
      adminId,
      action: 'FILE_UPLOADED',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        url: result.secure_url
      }
    }).catch(err => console.error('[Audit] Failed to log FILE_UPLOADED:', err));

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed', error: 'Internal server error' }, { status: 500 });
  }
}
