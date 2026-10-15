import { NextResponse } from 'next/server';
import { z } from 'zod';
import { propertyStatuses, propertyTypes, propertyAvailabilityValues, publicationStatuses } from '@/lib/db/types';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { adminPropertySchema, createPropertySlug, serializeProperty } from '@/lib/admin-property';
import { createProperty, listAdminProperties, listPropertiesMedia } from '@/lib/db/queries/properties';
import { hasPostgresErrorCode } from '@/lib/db/errors';

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  publicationStatus: z.enum(publicationStatuses).optional(),
  status: z.enum(propertyStatuses).optional(),
  propertyType: z.enum(propertyTypes).optional(),
  availability: z.enum(propertyAvailabilityValues).optional(),
  priceMin: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
  priceMax: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
  sort: z.enum(['updated', 'price_asc', 'price_desc']).default('updated'),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('20'),
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const parsed = listQuerySchema.safeParse({
    search: searchParams.get('search') ?? undefined,
    publicationStatus: searchParams.get('publicationStatus') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    propertyType: searchParams.get('propertyType') ?? undefined,
    availability: searchParams.get('availability') ?? undefined,
    priceMin: searchParams.get('priceMin') ?? undefined,
    priceMax: searchParams.get('priceMax') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
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

  try {
    const { data: properties, total } = await listAdminProperties({
      search: parsed.data.search,
      publicationStatus: parsed.data.publicationStatus,
      status: parsed.data.status,
      propertyType: parsed.data.propertyType,
      availability: parsed.data.availability,
      priceMin: parsed.data.priceMin === undefined ? undefined : Number(parsed.data.priceMin),
      priceMax: parsed.data.priceMax === undefined ? undefined : Number(parsed.data.priceMax),
      sort: parsed.data.sort,
      limit,
      offset: skip,
    });

    const media = await listPropertiesMedia(properties.map((property) => property.id));
    const covers = new Map(media.filter((item) => item.position === 0).map((item) => [item.propertyId, item.deliveryUrl]));
    return NextResponse.json({
      success: true,
      data: properties.map((property) => ({ ...serializeProperty(property), coverImage: covers.get(property.id) ?? null })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to list admin properties.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve properties right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
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
    const property = await createProperty({
      ...parsed.data,
      slug,
    });
    return NextResponse.json({ success: true, data: serializeProperty(property) }, { status: 201 });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return NextResponse.json({ success: false, error: 'A property with this slug already exists.' }, { status: 409 });
    }
    console.error('Failed to create admin property.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to create property right now.' }, { status: 500 });
  }
}
