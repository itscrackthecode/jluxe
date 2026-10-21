import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { careerApplicationStatuses } from '@/lib/career-types';
import { listCareerApplications } from '@/lib/db/queries/careers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  search: z.string().trim().max(200).optional(),
  jobId: z.string().uuid().optional(),
  status: z.enum(careerApplicationStatuses).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
}).strict();

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(session.role)) return NextResponse.json({ success: false, error: 'You do not have permission to view candidate applications.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    search: params.get('search') ?? undefined,
    jobId: params.get('jobId') ?? undefined,
    status: params.get('status') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    page: params.get('page') ?? undefined,
    limit: params.get('limit') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application filters.' }, { status: 400 });
  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  const offset = (page - 1) * limit;
  if (limit > 50 || !Number.isSafeInteger(offset) || parsed.data.from && parsed.data.to && parsed.data.from > parsed.data.to) {
    return NextResponse.json({ success: false, error: 'Invalid application filters or pagination.' }, { status: 400 });
  }
  try {
    const result = await listCareerApplications({ ...parsed.data, limit, offset });
    return NextResponse.json({ success: true, ...result, pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to list Careers applications.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve applications right now.' }, { status: 500 });
  }
}
