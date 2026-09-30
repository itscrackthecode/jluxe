import { NextResponse } from 'next/server';
import { z } from 'zod';
import { EnquiryStatus, Prisma } from '@/generated/prisma/client';
import { getAdminSession } from '@/lib/admin-session';
import { prisma } from '@/lib/prisma';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(EnquiryStatus).optional(),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
});

const enquiryListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  interestedServiceLabel: true,
  status: true,
  createdAt: true,
  property: {
    select: {
      title: true,
      slug: true,
      location: true,
    },
  },
} satisfies Prisma.EnquirySelect;

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

  const search = parsed.data.search;
  const where: Prisma.EnquiryWhereInput = {
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { message: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [total, enquiries] = await prisma.$transaction([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        select: enquiryListSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: enquiries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to list admin enquiries.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ success: false, error: 'Unable to retrieve enquiries right now.' }, { status: 500 });
  }
}