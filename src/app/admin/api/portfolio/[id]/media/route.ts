import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { listPortfolioWorkMedia, updatePortfolioWorkMedia } from '@/lib/db/queries/portfolio';

const idSchema = z.string().uuid();
const mediaUpdateSchema = z.object({
  media: z.array(
    z.object({
      mediaId: z.string().uuid(),
      altText: z.string().max(255).nullable().optional(),
    }),
  ),
}).strict();

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
  }

  try {
    const media = await listPortfolioWorkMedia([id]);
    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('Failed to list portfolio work media.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to retrieve work media right now.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid media items payload.' }, { status: 400 });
  }

  try {
    const result = await updatePortfolioWorkMedia(id, parsed.data.media);
    if (result === 'work-missing') {
      return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
    }
    if (result === 'media-missing') {
      return NextResponse.json({ success: false, error: 'One or more selected media items were not found.' }, { status: 400 });
    }

    const updatedMedia = await listPortfolioWorkMedia([id]);
    return NextResponse.json({ success: true, data: updatedMedia });
  } catch (error) {
    console.error('Failed to update portfolio work media.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to update work media right now.' }, { status: 500 });
  }
}
