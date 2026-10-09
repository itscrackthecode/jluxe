import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { deleteMediaIfUnused } from '@/lib/db/queries/media';
import { destroyCloudinaryImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'delete-content')) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const { id } = await context.params;
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid media id.' }, { status: 400 });

  let result: 'deleted' | 'missing' | 'in-use';
  try {
    result = await deleteMediaIfUnused(parsed.data, destroyCloudinaryImage);
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to delete the cloud image. The media record was kept.' }, { status: 502 });
  }
  if (result === 'in-use') return NextResponse.json({ success: false, error: 'This media is currently in use and cannot be deleted.' }, { status: 409 });
  if (result === 'missing') return NextResponse.json({ success: false, error: 'Media not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
