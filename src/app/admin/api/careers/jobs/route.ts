import { NextResponse } from 'next/server';
import { careerJobInputSchema } from '@/lib/career-validation';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { readJsonBody } from '@/lib/read-json-body';
import { createAdminCareerJob, listAdminCareerJobs } from '@/lib/db/queries/careers';
import { getCareerJobSaveErrorContext, hasPostgresErrorCode } from '@/lib/db/errors';
import { z } from 'zod';
import { careerJobStatuses } from '@/lib/career-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const listSchema = z.object({ search: z.string().trim().max(200).optional(), status: z.enum(careerJobStatuses).optional() }).strict();

function makeSlug(title: string) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
}

export async function GET(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const query = new URL(request.url).searchParams;
  const parsed = listSchema.safeParse({ search: query.get('search') ?? undefined, status: query.get('status') ?? undefined });
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid vacancy filters.' }, { status: 400 });
  try {
    const data = await listAdminCareerJobs(parsed.data.search, parsed.data.status);
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to list Careers vacancies.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve vacancies right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'edit-content')) return NextResponse.json({ success: false, error: 'You do not have permission to manage vacancies.' }, { status: 403 });

  const body = await readJsonBody(request, 48 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = careerJobInputSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Review the vacancy details before saving.', issues: parsed.error.issues.map(({ path, message }) => ({ path: path.map(String), message })) }, { status: 400 });
  const slug = parsed.data.slug || makeSlug(parsed.data.title);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ success: false, error: 'Use a lowercase URL slug with letters, numbers and hyphens.' }, { status: 400 });

  try {
    const data = await createAdminCareerJob({ ...parsed.data, slug }, session.adminId);
    return NextResponse.json({ success: true, data }, { status: 201, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) return NextResponse.json({ success: false, error: 'A vacancy with this URL slug already exists.' }, { status: 409 });
    console.error('Failed to create a Careers vacancy.', getCareerJobSaveErrorContext(error));
    return NextResponse.json({ success: false, error: 'Unable to save the vacancy right now.' }, { status: 500 });
  }
}
