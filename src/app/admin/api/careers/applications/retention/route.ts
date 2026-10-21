import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { deleteCareerApplicationIfExpired, listExpiredCareerApplications } from '@/lib/db/queries/careers';
import { destroyPrivateCareerResume } from '@/lib/careers-resume-storage';
import { readJsonBody } from '@/lib/read-json-body';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const retentionSchema = z.object({ days: z.number().int().min(1).max(36500) }).strict();

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'OWNER' && session.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'You do not have permission to manage applicant records.' }, { status: 403 });
  const body = await readJsonBody(request, 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = retentionSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Enter a retention period in whole days.' }, { status: 400 });

  try {
    const expired = await listExpiredCareerApplications(parsed.data.days);
    let deleted = 0;
    let failed = 0;
    for (const application of expired) {
      try {
        await destroyPrivateCareerResume(application.resumeStorageKey);
        if (await deleteCareerApplicationIfExpired(application.id, parsed.data.days)) deleted += 1;
      } catch (error) {
        failed += 1;
        console.error('A Careers retention item could not be removed.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
      }
    }
    return NextResponse.json({ success: true, deleted, failed, batchLimit: 50 }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    console.error('Careers retention processing failed.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to process application retention.' }, { status: 500 });
  }
}
