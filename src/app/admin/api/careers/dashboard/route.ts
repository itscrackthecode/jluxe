import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { getCareerDashboardCounts } from '@/lib/db/queries/careers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  try {
    const data = await getCareerDashboardCounts();
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    console.error('Failed to retrieve Careers dashboard counts.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve Careers dashboard counts.' }, { status: 500 });
  }
}
