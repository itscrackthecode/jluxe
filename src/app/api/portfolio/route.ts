import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const portfolioQuerySchema = z.object({
  service: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().min(1).max(255).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['latest', 'oldest', 'featured']).default('latest'),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('12'),
});

const portfolioSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  location: true,
  year: true,
  featured: true,
  createdAt: true,
  service: {
    select: {
      id: true,
      slug: true,
      title: true,
    },
  },
  media: {
    orderBy: { position: 'asc' },
    select: {
      position: true,
      altText: true,
      media: {
        select: {
          id: true,
          storageKey: true,
          mimeType: true,
          width: true,
          height: true,
        },
      },
    },
  },
} satisfies Prisma.PortfolioWorkSelect;

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = portfolioQuerySchema.safeParse({
    service: searchParams.get('service') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    featured: searchParams.get('featured') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error = field === 'featured'
      ? 'Invalid featured filter.'
      : field === 'sort'
        ? 'Invalid sort order.'
        : field === 'page' || field === 'limit'
          ? 'Invalid pagination values.'
          : field === 'service'
            ? 'Invalid service filter.'
            : 'Invalid location filter.';

    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { service: serviceSlug, location, featured: featuredValue, sort } = parsed.data;
  const page = Number(parsed.data.page);
  const limit = Number(parsed.data.limit);
  const skip = (page - 1) * limit;

  if (limit > 50 || !Number.isSafeInteger(page) || !Number.isSafeInteger(skip)) {
    return NextResponse.json(
      { success: false, error: 'Invalid pagination values.' },
      { status: 400 },
    );
  }

  try {
    let serviceId: string | undefined;

    if (serviceSlug) {
      const service = await prisma.service.findUnique({
        where: { slug: serviceSlug },
        select: { id: true },
      });

      if (!service) {
        return NextResponse.json(
          { success: false, error: 'Service not found.' },
          { status: 404 },
        );
      }

      serviceId = service.id;
    }

    const where: Prisma.PortfolioWorkWhereInput = {
      publicationStatus: 'PUBLISHED',
      ...(serviceId ? { serviceId } : {}),
      ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
      ...(featuredValue !== undefined ? { featured: featuredValue === 'true' } : {}),
    };

    const orderBy: Prisma.PortfolioWorkOrderByWithRelationInput[] = sort === 'latest'
      ? [{ createdAt: 'desc' }, { id: 'desc' }]
      : sort === 'oldest'
        ? [{ createdAt: 'asc' }, { id: 'asc' }]
        : [{ featured: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];

    const [total, works] = await prisma.$transaction([
      prisma.portfolioWork.count({ where }),
      prisma.portfolioWork.findMany({
        where,
        select: portfolioSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: works.map(({ media, ...work }) => ({
        ...work,
        media: media.map(({ media: image, position, altText }) => ({
          ...image,
          position,
          altText,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to list public portfolio work.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { success: false, error: 'Unable to retrieve portfolio work right now.' },
      { status: 500 },
    );
  }
}