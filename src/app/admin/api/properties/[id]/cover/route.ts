import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { setPropertyCover } from '@/lib/db/queries/properties';

const idSchema = z.string().uuid();
const coverSchema = z.object({ mediaId: z.string().uuid().nullable() }).strict();

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = coverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid cover selection.' }, { status: 400 });
  }

  try {
    const result = await setPropertyCover(id, parsed.data.mediaId);
    if (result === 'property-missing') {
      return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    }
    if (result === 'media-missing') {
      return NextResponse.json({ success: false, error: 'The selected media was not found.' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to set property cover.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to update the cover image right now.' }, { status: 500 });
  }
}
