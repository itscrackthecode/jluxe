import { NextResponse } from 'next/server';
import { z } from 'zod';
import { enquiryStatuses } from '@/lib/db/types';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { deleteAdminEnquiries, listAdminEnquiries } from '@/lib/db/queries/enquiries';
import { hasSameOrigin } from '@/lib/admin-request';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(enquiryStatuses).optional(),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
});
const enquiryIdSchema = z.string().regex(/^(?:[eb]:)[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const deleteSchema = z.object({ ids: z.array(enquiryIdSchema).min(1).max(50) }).strict()
  .refine(({ ids }) => new Set(ids).size === ids.length, 'Enquiry IDs must be unique.');

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = listQuerySchema.safeParse({
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid enquiry filters or pagination.' }, { status: 400 });
  }

  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  const skip = (page - 1) * limit;
  if (limit > 50 || !Number.isSafeInteger(page) || !Number.isSafeInteger(skip)) {
    return NextResponse.json({ success: false, error: 'Invalid enquiry pagination.' }, { status: 400 });
  }

  try {
    const { data, total } = await listAdminEnquiries({
      search: parsed.data.search,
      status: parsed.data.status,
      limit,
      offset: skip,
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to list admin enquiries.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to retrieve enquiries right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'delete-content')) {
    return NextResponse.json({ success: false, error: 'You do not have permission to delete enquiries.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Select between 1 and 50 unique enquiries.' }, { status: 400 });

  try {
    const deleted = await deleteAdminEnquiries(parsed.data.ids);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    if (error instanceof Error && error.message === 'ENQUIRY_SELECTION_CHANGED') {
      return NextResponse.json({ success: false, error: 'One or more selected enquiries are no longer available. Refresh the list and try again.' }, { status: 409 });
    }
    console.error('Failed to delete admin enquiries.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to delete the selected enquiries right now.' }, { status: 500 });
  }
}
