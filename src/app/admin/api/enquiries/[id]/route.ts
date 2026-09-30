import { NextResponse } from 'next/server';
import { z } from 'zod';
import { EnquiryStatus, Prisma } from '@/generated/prisma/client';
import { getAdminSession } from '@/lib/admin-session';
import { prisma } from '@/lib/prisma';

const idSchema = z.string().uuid();
const statusUpdateSchema = z.object({
  status: z.enum(EnquiryStatus),
}).strict();

const enquiryDetailSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  interestedServiceId: true,
  interestedServiceLabel: true,
  propertyId: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  interestedService: {
    select: {
      title: true,
      slug: true,
    },
  },
  property: {
    select: {
      title: true,
      slug: true,
      location: true,
    },
  },
} satisfies Prisma.EnquirySelect;

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
    const enquiry = await prisma.enquiry.findUnique({ where: { id }, select: enquiryDetailSelect });
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
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true, updatedAt: true },
    });

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });
    }

    console.error('Failed to update admin enquiry status.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to update this enquiry right now.' }, { status: 500 });
  }
}