import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { getCareerApplication } from '@/lib/db/queries/careers';
import { createPrivateCareerResumeDownloadUrl } from '@/lib/careers-resume-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const paramsSchema = z.object({ id: z.string().uuid() });
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'OWNER' && session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'You do not have permission to download resumes.' }, { status: 403 });
  }
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
  try {
    const application = await getCareerApplication(parsed.data.id);
    if (!application) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: createPrivateCareerResumeDownloadUrl(application.resumeStorageKey),
        'Cache-Control': 'private, no-store, max-age=0',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    console.error('Failed to prepare a Careers resume download.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to download this resume right now.' }, { status: 500 });
  }
}
