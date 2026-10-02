import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { listAdminMedia } from '@/lib/db/queries/media';

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
    return NextResponse.json({ success: true, data: result.data, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to retrieve media right now.' }, { status: 500 });
  }
}

export async function POST() {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  return NextResponse.json({ success: false, error: 'No external storage provider is configured yet. Upload integration is pending.' }, { status: 503 });
}
