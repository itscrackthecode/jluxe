import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma, PropertyStatus, PropertyType, PublicationStatus } from '@/generated/prisma/client';
import { getAdminSession } from '@/lib/admin-session';
import { adminPropertySchema, createPropertySlug, serializeProperty } from '@/lib/admin-property';
import { prisma } from '@/lib/prisma';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  publicationStatus: z.enum(PublicationStatus).optional(),
  status: z.enum(PropertyStatus).optional(),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
});

const propertySelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  location: true,
  propertyType: true,
  priceAmount: true,
  priceCurrency: true,
  priceMode: true,
  plotSize: true,
  plotSizeUnit: true,
  status: true,
  representationType: true,
  publicationStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PropertySelect;

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const parsed = listQuerySchema.safeParse({
    search: searchParams.get('search') ?? undefined,
    publicationStatus: searchParams.get('publicationStatus') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid property filters or pagination.' }, { status: 400 });

  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  const skip = (page - 1) * limit;
  if (limit > 50 || !Number.isSafeInteger(page) || !Number.isSafeInteger(skip)) {
    return NextResponse.json({ success: false, error: 'Invalid property pagination.' }, { status: 400 });
  }

  const where: Prisma.PropertyWhereInput = {
    ...(parsed.data.publicationStatus ? { publicationStatus: parsed.data.publicationStatus } : {}),
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.search
      ? {
          OR: [
            { title: { contains: parsed.data.search, mode: 'insensitive' } },
            { location: { contains: parsed.data.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [total, properties] = await prisma.$transaction([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        select: propertySelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: properties.map(serializeProperty),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to list admin properties.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve properties right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = adminPropertySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid property details.' }, { status: 400 });

  const slug = parsed.data.slug || createPropertySlug(parsed.data.title);
  if (!slug) return NextResponse.json({ success: false, error: 'Enter a title that can form a URL slug.' }, { status: 400 });

  try {
    const property = await prisma.property.create({
      data: { ...parsed.data, slug, priceAmount: parsed.data.priceAmount, plotSize: parsed.data.plotSize },
      select: propertySelect,
    });
    return NextResponse.json({ success: true, data: serializeProperty(property) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'A property with this slug already exists.' }, { status: 409 });
    }
    console.error('Failed to create admin property.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create property right now.' }, { status: 500 });
  }
}