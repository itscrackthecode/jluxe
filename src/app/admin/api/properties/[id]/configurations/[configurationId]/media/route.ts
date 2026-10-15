import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { updatePropertyConfigurationMedia } from '@/lib/db/queries/properties';
import { readJsonBody } from '@/lib/read-json-body';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string; configurationId: string }> };
const idSchema = z.string().uuid();

export async function PUT(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'edit-content')) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const { id, configurationId } = await params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(configurationId).success) return NextResponse.json({ success: false, error: 'Configuration not found.' }, { status: 404 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = z.object({ mediaIds: z.array(z.string().uuid()).max(12) }).strict().safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Choose up to 12 valid images.' }, { status: 400 });
  try {
    const result = await updatePropertyConfigurationMedia(id, configurationId, parsed.data.mediaIds);
    if (result === 'configuration-missing') return NextResponse.json({ success: false, error: 'Configuration not found.' }, { status: 404 });
    if (result === 'media-missing') return NextResponse.json({ success: false, error: 'One or more images are unavailable.' }, { status: 400 });
    if (result === 'invalid-media') return NextResponse.json({ success: false, error: 'Select image files only.' }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to save configuration images.' }, { status: 500 });
  }
}
