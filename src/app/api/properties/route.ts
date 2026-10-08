import { NextResponse } from 'next/server';
import { z } from 'zod';
import { propertyStatuses, propertyTypes } from '@/lib/db/types';
import { formatNumericValue } from '@/lib/db/numeric';
import { listPropertiesMedia, listPublicProperties } from '@/lib/db/queries/properties';

const pricePattern = /^\d+(\.\d+)?$/;

const propertyQuerySchema = z.object({
  location: z.string().trim().min(1).max(255).optional(),
  propertyType: z.enum(propertyTypes).optional(),
  status: z.enum(propertyStatuses).optional(),
  priceMin: z.string().regex(pricePattern).optional(),
  priceMax: z.string().regex(pricePattern).optional(),
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
    priceMin: searchParams.get('priceMin') ?? undefined,
    priceMax: searchParams.get('priceMax') ?? undefined,
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
        : field === 'priceMin' || field === 'priceMax'
          ? 'Invalid price filter.'
          : field === 'sort'
            ? 'Invalid sort order.'
            : field === 'page' || field === 'limit'
              ? 'Invalid pagination values.'
              : 'Invalid location filter.';

    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { location, propertyType, status, sort } = parsed.data;
  const priceMin = parsed.data.priceMin !== undefined ? Number(parsed.data.priceMin) : undefined;
  const priceMax = parsed.data.priceMax !== undefined ? Number(parsed.data.priceMax) : undefined;
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
      priceMin,
      priceMax,
      sort,
      limit,
      offset: skip,
    });

    const media = await listPropertiesMedia(properties.map((property) => property.id));
    const mediaByProperty = new Map<string, Array<{
      id: string;
      storageKey: string;
      deliveryUrl?: string | null;
      mimeType: string;
      width: number | null;
      height: number | null;
      position: number;
      altText: string | null;
    }>>();

    for (const image of media) {
      const propertyImages = mediaByProperty.get(image.propertyId) ?? [];
      propertyImages.push({
        id: image.id,
        storageKey: image.storageKey,
        deliveryUrl: image.deliveryUrl,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        position: image.position,
        altText: image.altText,
      });
      mediaByProperty.set(image.propertyId, propertyImages);
    }

    return NextResponse.json({
      success: true,
      data: properties.map((property) => {
        const propMedia = mediaByProperty.get(property.id) ?? [];
        const coverMedia = propMedia.find((m) => m.position === 0) ?? propMedia[0] ?? null;
        return {
          ...property,
          priceAmount: formatNumericValue(property.priceAmount),
          plotSize: formatNumericValue(property.plotSize),
          coverImage: coverMedia ? { storageKey: coverMedia.storageKey, deliveryUrl: coverMedia.deliveryUrl, altText: coverMedia.altText } : null,
          media: propMedia,
        };
      }),
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
