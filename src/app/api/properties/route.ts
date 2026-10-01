import { NextResponse } from 'next/server';
import { z } from 'zod';
import { propertyStatuses, propertyTypes } from '@/lib/db/types';
import { formatNumericValue } from '@/lib/db/numeric';
import { listPublicProperties } from '@/lib/db/queries/properties';

const propertyQuerySchema = z.object({
  location: z.string().trim().min(1).max(255).optional(),
  propertyType: z.enum(propertyTypes).optional(),
  status: z.enum(propertyStatuses).optional(),
  sort: z.enum(['latest', 'price_asc', 'price_desc']).default('latest'),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('12'),
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = propertyQuerySchema.safeParse({
    location: searchParams.get('location') ?? undefined,
    propertyType: searchParams.get('propertyType') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error = field === 'propertyType'
      ? 'Invalid property type.'
      : field === 'status'
        ? 'Invalid property status.'
        : field === 'sort'
          ? 'Invalid sort order.'
          : field === 'page' || field === 'limit'
            ? 'Invalid pagination values.'
            : 'Invalid location filter.';

    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { location, propertyType, status, sort } = parsed.data;
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
    const { data: properties, total } = await listPublicProperties({
      location,
      propertyType,
      status,
      sort,
      limit,
      offset: skip,
    });

    return NextResponse.json({
      success: true,
      data: properties.map((property) => ({
        ...property,
        priceAmount: formatNumericValue(property.priceAmount),
        plotSize: formatNumericValue(property.plotSize),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to list public properties.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { success: false, error: 'Unable to retrieve properties right now.' },
      { status: 500 },
    );
  }
}