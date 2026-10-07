import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { listAdminMedia } from '@/lib/db/queries/media';
import { createCloudinaryMedia } from '@/lib/db/queries/media';
import { createCloudinaryUploadSignature, destroyCloudinaryImage, getCloudinaryImageDetails, isCloudinaryConfigured, verifyCloudinaryUpload } from '@/lib/cloudinary';

const mediaQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  mimeType: z.string().trim().max(100).optional(),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const parsed = mediaQuerySchema.safeParse({
    search: params.get('search') ?? undefined,
    mimeType: params.get('mimeType') ?? undefined,
    page: params.get('page') ?? undefined,
    limit: params.get('limit') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid media filters or pagination.' }, { status: 400 });
  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  if (limit > 50) return NextResponse.json({ success: false, error: 'Invalid media pagination.' }, { status: 400 });

  try {
    const result = await listAdminMedia({ search: parsed.data.search, mimeType: parsed.data.mimeType, limit, offset: (page - 1) * limit });
    return NextResponse.json({ success: true, data: result.data, cloudinaryConfigured: isCloudinaryConfigured(), pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to retrieve media right now.' }, { status: 500 });
  }
}

const uploadSchema = z.object({
  intent: z.literal('complete'), publicId: z.string().min(1).max(500), version: z.number().int().positive(), signature: z.string().regex(/^[a-f0-9]{40}$/i),
  secureUrl: z.string().url(), format: z.enum(['jpg', 'jpeg', 'png', 'webp', 'avif']), bytes: z.number().int().positive().max(10 * 1024 * 1024),
  width: z.number().int().positive().max(30000), height: z.number().int().positive().max(30000), resourceType: z.literal('image'),
});

const uploadSignatureSchema = z.object({
  intent: z.literal('sign'),
  purpose: z.enum(['website', 'properties', 'portfolio']).default('website'),
});

const uploadFolders = {
  website: 'jluxe/website',
  properties: 'jluxe/properties',
  portfolio: 'jluxe/portfolio',
} as const;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid upload request.' }, { status: 400 }); }
  if (typeof payload === 'object' && payload !== null && 'intent' in payload && payload.intent === 'sign') {
    const signingRequest = uploadSignatureSchema.safeParse(payload);
    if (!signingRequest.success) return NextResponse.json({ success: false, error: 'Invalid upload request.' }, { status: 400 });
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const assetFolder = uploadFolders[signingRequest.data.purpose];
      return NextResponse.json({ success: true, timestamp, ...createCloudinaryUploadSignature(timestamp, assetFolder) });
    } catch {
      return NextResponse.json({ success: false, error: 'Cloudinary is not configured.' }, { status: 503 });
    }
  }
  const parsed = uploadSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid image upload response.' }, { status: 400 });
  const item = parsed.data;
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const url = new URL(item.secureUrl);
    if (!cloudName || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || !url.pathname.startsWith(`/${cloudName}/image/upload/`)
      || !verifyCloudinaryUpload(item.publicId, item.version, item.signature)) {
      return NextResponse.json({ success: false, error: 'Cloudinary upload verification failed.' }, { status: 400 });
    }
    const verified = await getCloudinaryImageDetails(item.publicId);
    if (verified.public_id !== item.publicId || verified.resource_type !== 'image'
      || !['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(verified.format)
      || !Number.isSafeInteger(verified.bytes) || verified.bytes <= 0 || verified.bytes > 10 * 1024 * 1024
      || !Number.isSafeInteger(verified.width) || !Number.isSafeInteger(verified.height)) {
      await destroyCloudinaryImage(item.publicId).catch(() => {});
      return NextResponse.json({ success: false, error: 'Only supported images up to 10 MB can be saved.' }, { status: 400 });
    }
    const mimeType = verified.format === 'jpg' || verified.format === 'jpeg' ? 'image/jpeg' : `image/${verified.format}`;
    try {
      const media = await createCloudinaryMedia({ storageKey: item.publicId, mimeType, byteSize: verified.bytes, width: verified.width, height: verified.height, adminId: session.adminId });
      return NextResponse.json({ success: true, data: media }, { status: 201 });
    } catch {
      try { await destroyCloudinaryImage(item.publicId); } catch { /* Keep the response generic; the cloud asset may need manual cleanup. */ }
      return NextResponse.json({ success: false, error: 'Unable to save uploaded media.' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to save uploaded media.' }, { status: 500 });
  }
}
