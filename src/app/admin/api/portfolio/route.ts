import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminPortfolioSchema } from '@/lib/admin-portfolio';
import { getAdminSession } from '@/lib/admin-session';
import { hasPostgresErrorCode } from '@/lib/db/errors';
import {
  createAdminPortfolioWork,
  findPortfolioServiceById,
  listAdminPortfolio,
  type PortfolioSort,
} from '@/lib/db/queries/portfolio';
import { publicationStatuses } from '@/lib/db/types';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  serviceId: z.string().uuid().optional(),
  publicationStatus: z.enum(publicationStatuses).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['latest', 'oldest', 'featured']).default('latest'),
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
    serviceId: searchParams.get('serviceId') ?? undefined,
    publicationStatus: searchParams.get('publicationStatus') ?? undefined,
    featured: searchParams.get('featured') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid portfolio filters or pagination.' }, { status: 400 });
  }

  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  const offset = (page - 1) * limit;
  if (limit > 50 || !Number.isSafeInteger(page) || !Number.isSafeInteger(offset)) {
    return NextResponse.json({ success: false, error: 'Invalid portfolio pagination.' }, { status: 400 });
  }

  try {
    const result = await listAdminPortfolio({
      search: parsed.data.search,
      serviceId: parsed.data.serviceId,
      publicationStatus: parsed.data.publicationStatus,
      featured: parsed.data.featured === undefined ? undefined : parsed.data.featured === 'true',
      sort: parsed.data.sort as PortfolioSort,
      limit,
      offset,
    });
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    });
  } catch (error) {
    console.error('Failed to list admin portfolio work.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve portfolio work right now.' }, { status: 500 });
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

  const parsed = adminPortfolioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid portfolio details.' }, { status: 400 });

  try {
    const service = await findPortfolioServiceById(parsed.data.serviceId);
    if (!service) return NextResponse.json({ success: false, error: 'The selected service was not found.' }, { status: 400 });

    const work = await createAdminPortfolioWork(parsed.data);
    return NextResponse.json({ success: true, data: work }, { status: 201 });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return NextResponse.json({ success: false, error: 'Portfolio work with this slug already exists.' }, { status: 409 });
    }
    if (hasPostgresErrorCode(error, '23503')) {
      return NextResponse.json({ success: false, error: 'The selected service was not found.' }, { status: 400 });
    }
    console.error('Failed to create admin portfolio work.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create portfolio work right now.' }, { status: 500 });
  }
}