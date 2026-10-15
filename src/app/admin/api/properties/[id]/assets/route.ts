import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { findPropertyById, listPropertyPromotionalMedia, updatePropertyPromotionalMedia } from '@/lib/db/queries/properties';
import { readJsonBody } from '@/lib/read-json-body';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.string().uuid();

export async function GET(_request: Request, { params }: RouteContext) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  if (!idSchema.safeParse(id).success || !await findPropertyById(id)) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  try { return NextResponse.json({ success: true, data: await listPropertyPromotionalMedia(id) }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }); }
  catch { return NextResponse.json({ success: false, error: 'Unable to retrieve property assets.' }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'edit-content')) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = z.object({ media: z.array(z.object({ mediaId: z.string().uuid(), kind: z.enum(['PROMO_LANDSCAPE','PROMO_PORTRAIT']) }).strict()).max(24) }).strict().safeParse(body.value);
  if (!parsed.success || parsed.success && (parsed.data.media.filter((item) => item.kind === 'PROMO_LANDSCAPE').length > 12 || parsed.data.media.filter((item) => item.kind === 'PROMO_PORTRAIT').length > 12)) return NextResponse.json({ success: false, error: 'Choose up to 12 promotional images per orientation.' }, { status: 400 });
  try {
    const result = await updatePropertyPromotionalMedia(id, parsed.data.media);
    if (result === 'property-missing') return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    if (result === 'media-missing') return NextResponse.json({ success: false, error: 'One or more selected images are unavailable.' }, { status: 400 });
    if (result === 'invalid-media') return NextResponse.json({ success: false, error: 'Select image files with the correct orientation for each promotional type.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await listPropertyPromotionalMedia(id) });
  } catch { return NextResponse.json({ success: false, error: 'Unable to save promotional assets.' }, { status: 500 }); }
}
