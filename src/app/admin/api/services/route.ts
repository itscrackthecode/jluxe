import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminServiceSchema } from '@/lib/admin-service';
import { hasPostgresErrorCode } from '@/lib/db/errors';
import { createAdminService, listAdminServices } from '@/lib/db/queries/services';
import { publicationStatuses } from '@/lib/db/types';
import { getAdminSession } from '@/lib/admin-session';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  publicationStatus: z.enum(publicationStatuses).optional(),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const parsed = listQuerySchema.safeParse({
    search: searchParams.get('search') ?? undefined,
    publicationStatus: searchParams.get('publicationStatus') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid service filters or pagination.' }, { status: 400 });
  }

  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  const offset = (page - 1) * limit;
  if (limit > 50 || !Number.isSafeInteger(page) || !Number.isSafeInteger(offset)) {
    return NextResponse.json({ success: false, error: 'Invalid service pagination.' }, { status: 400 });
  }

  try {
    const result = await listAdminServices({
      search: parsed.data.search,
      publicationStatus: parsed.data.publicationStatus,
      limit,
      offset,
    });
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('Failed to list admin services.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve services right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = adminServiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid service details.' }, { status: 400 });

  try {
    const service = await createAdminService(parsed.data);
    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return NextResponse.json({ success: false, error: 'A service with this slug already exists.' }, { status: 409 });
    }
    console.error('Failed to create admin service.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create service right now.' }, { status: 500 });
  }
}