import { NextResponse } from 'next/server';
import { z } from 'zod';
import { enquiryStatuses } from '@/lib/db/types';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { findEnquiryById, updateEnquiryStatus } from '@/lib/db/queries/enquiries';

const idSchema = z.string().regex(/^(?:[eb]:)?[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const statusUpdateSchema = z.object({
  status: z.enum(enquiryStatuses),
}).strict();

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
  }

  try {
    const enquiry = await findEnquiryById(id);
    if (!enquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    console.error('Failed to retrieve admin enquiry.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to retrieve this enquiry right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid enquiry status.' }, { status: 400 });
  }

  try {
    const enquiry = await updateEnquiryStatus(id, parsed.data.status);
    if (!enquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    console.error('Failed to update admin enquiry status.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to update this enquiry right now.' }, { status: 500 });
  }
}
