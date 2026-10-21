import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { careerApplicationStatuses } from '@/lib/career-types';
import { deleteCareerApplication, getCareerApplication, updateCareerApplication } from '@/lib/db/queries/careers';
import { destroyPrivateCareerResume } from '@/lib/careers-resume-storage';
import { readJsonBody } from '@/lib/read-json-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const paramsSchema = z.object({ id: z.string().uuid() });
const updateSchema = z.object({
  status: z.enum(careerApplicationStatuses),
  internalNotes: z.string().trim().max(10000),
}).strict();
type RouteContext = { params: Promise<{ id: string }> };

function canReviewApplications(role: string) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!canReviewApplications(session.role)) return NextResponse.json({ success: false, error: 'You do not have permission to view candidate applications.' }, { status: 403 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  try {
    const application = await getCareerApplication(parsed.data.id);
    if (!application) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    const { resumeStorageKey: _privateStorageKey, ...data } = application;
    return NextResponse.json({ success: true, data: { ...data, resumeAvailable: Boolean(_privateStorageKey) } }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to retrieve a Careers application.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve the application right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!canReviewApplications(session.role)) return NextResponse.json({ success: false, error: 'You do not have permission to review candidate applications.' }, { status: 403 });
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  const body = await readJsonBody(request, 12 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = updateSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application update.' }, { status: 400 });
  try {
    const updated = await updateCareerApplication(parsedParams.data.id, parsed.data, session.adminId);
    return updated
      ? NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
      : NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  } catch (error) {
    console.error('Failed to update a Careers application.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update the application right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!canReviewApplications(session.role)) return NextResponse.json({ success: false, error: 'You do not have permission to delete candidate applications.' }, { status: 403 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  try {
    const application = await getCareerApplication(parsed.data.id);
    if (!application) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    await destroyPrivateCareerResume(application.resumeStorageKey);
    await deleteCareerApplication(application.id);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to delete a Careers application.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to delete the application right now.' }, { status: 500 });
  }
}
