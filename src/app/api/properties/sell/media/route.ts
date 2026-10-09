import { NextResponse } from 'next/server';
import { createSellerCloudinaryUploadSignature, destroyCloudinaryImage, getCloudinaryImageDetails, verifySellerCloudinaryUpload } from '@/lib/cloudinary';
import { checkPublicApiRateLimit, publicApiRateLimitResponse } from '@/lib/public-api-rate-limit';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_MEDIA_REQUESTS_PER_WINDOW = 20;

export async function POST(request: Request) {
  const rateLimit = await checkPublicApiRateLimit(request, {
    endpoint: 'POST /api/properties/sell/media',
    limit: MAX_MEDIA_REQUESTS_PER_WINDOW,
    windowMs: WINDOW_MS,
  });
  const rateLimitResponse = publicApiRateLimitResponse(rateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  const now = Date.now();

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid upload request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !('intent' in body)) {
    return NextResponse.json({ success: false, error: 'Invalid upload request.' }, { status: 400 });
  }

  if (body.intent === 'verify' || body.intent === 'discard') {
    const image = body as { intent: string; publicId?: unknown; version?: unknown; signature?: unknown; secureUrl?: unknown };
    if (typeof image.publicId !== 'string' || typeof image.version !== 'number' || typeof image.signature !== 'string' || typeof image.secureUrl !== 'string'
      || !verifySellerCloudinaryUpload(image.publicId, image.version, image.signature, image.secureUrl)) {
      return NextResponse.json({ success: false, error: 'This photo could not be verified.' }, { status: 400 });
    }
    try {
      const verified = await getCloudinaryImageDetails(image.publicId);
      if (verified.public_id !== image.publicId || verified.asset_folder !== 'jluxe/seller-submissions'
        || verified.resource_type !== 'image' || !['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(verified.format)
        || !Number.isSafeInteger(verified.bytes) || verified.bytes <= 0 || verified.bytes > 10 * 1024 * 1024
        || !Number.isSafeInteger(verified.width) || !Number.isSafeInteger(verified.height)) {
        return NextResponse.json({ success: false, error: 'Photos must be supported images no larger than 10 MB.' }, { status: 400 });
      }
      if (body.intent === 'discard') {
        await destroyCloudinaryImage(image.publicId);
      }
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: 'This photo could not be verified.' }, { status: 400 });
    }
  }

  if (body.intent !== 'sign') return NextResponse.json({ success: false, error: 'Invalid upload request.' }, { status: 400 });

  try {
    const timestamp = Math.floor(now / 1000);
    const signature = createSellerCloudinaryUploadSignature(timestamp);
    return NextResponse.json({ success: true, timestamp, ...signature });
  } catch {
    return NextResponse.json({ success: false, error: 'Image uploads are temporarily unavailable.' }, { status: 503 });
  }
}
