import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { deleteMediaIfUnused } from '@/lib/db/queries/media';

export const runtime = 'nodejs';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const { id } = await context.params;
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid media id.' }, { status: 400 });

  const result = await deleteMediaIfUnused(parsed.data);
  if (result === 'in-use') return NextResponse.json({ success: false, error: 'This media is currently in use and cannot be deleted.' }, { status: 409 });
  if (result === 'missing') return NextResponse.json({ success: false, error: 'Media not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
