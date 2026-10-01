import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminServiceSchema } from '@/lib/admin-service';
import { hasPostgresErrorCode } from '@/lib/db/errors';
import { findAdminServiceById, updateAdminService } from '@/lib/db/queries/services';
import { getAdminSession } from '@/lib/admin-session';

const idSchema = z.string().uuid();
export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Service not found.' }, { status: 404 });

  try {
    const service = await findAdminServiceById(id);
    if (!service) return NextResponse.json({ success: false, error: 'Service not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Failed to retrieve admin service.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve service right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Service not found.' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = adminServiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid service details.' }, { status: 400 });

  try {
    const service = await updateAdminService(id, parsed.data);
    if (!service) return NextResponse.json({ success: false, error: 'Service not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return NextResponse.json({ success: false, error: 'A service with this slug already exists.' }, { status: 409 });
    }
    console.error('Failed to update admin service.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update service right now.' }, { status: 500 });
  }
}