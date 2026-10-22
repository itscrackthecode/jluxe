import { NextResponse } from 'next/server';
import { careerJobInputSchema } from '@/lib/career-validation';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { readJsonBody } from '@/lib/read-json-body';
import { getAdminCareerJob, updateAdminCareerJob } from '@/lib/db/queries/careers';
import { getCareerJobSaveErrorContext, hasPostgresErrorCode } from '@/lib/db/errors';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const paramsSchema = z.object({ id: z.string().uuid() });
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ success: false, error: 'Vacancy not found.' }, { status: 404 });
  try {
    const data = await getAdminCareerJob(parsedParams.data.id);
    return data
      ? NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
      : NextResponse.json({ success: false, error: 'Vacancy not found.' }, { status: 404 });
  } catch (error) {
    console.error('Failed to retrieve a Careers vacancy.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve the vacancy right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'edit-content')) return NextResponse.json({ success: false, error: 'You do not have permission to manage vacancies.' }, { status: 403 });
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ success: false, error: 'Vacancy not found.' }, { status: 404 });
  const body = await readJsonBody(request, 48 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = careerJobInputSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Review the vacancy details before saving.', issues: parsed.error.issues.map(({ path, message }) => ({ path: path.map(String), message })) }, { status: 400 });
  const slug = parsed.data.slug || parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ success: false, error: 'Use a lowercase URL slug with letters, numbers and hyphens.' }, { status: 400 });
  try {
    const data = await updateAdminCareerJob(parsedParams.data.id, { ...parsed.data, slug }, session.adminId);
    return data
      ? NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
      : NextResponse.json({ success: false, error: 'Vacancy not found.' }, { status: 404 });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) return NextResponse.json({ success: false, error: 'A vacancy with this URL slug already exists.' }, { status: 409 });
    console.error('Failed to update a Careers vacancy.', getCareerJobSaveErrorContext(error));
    return NextResponse.json({ success: false, error: 'Unable to save the vacancy right now.' }, { status: 500 });
  }
}
