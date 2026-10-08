import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findServiceBySlug, listPortfolioWorkMedia, listPublicPortfolio, listServiceCategories } from '@/lib/db/queries/portfolio';

const portfolioQuerySchema = z.object({
  service: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  location: z.string().trim().min(1).max(255).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['latest', 'oldest', 'featured']).default('latest'),
  page: z.string().regex(/^[1-9]\d*$/).default('1'),
  limit: z.string().regex(/^[1-9]\d*$/).default('12'),
});

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = portfolioQuerySchema.safeParse({
    service: searchParams.get('service') ?? undefined,
    category: searchParams.get('category') ?? undefined,
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
            : field === 'category'
              ? 'Invalid category filter.'
            : 'Invalid location filter.';

    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { service: serviceSlug, category, location, featured: featuredValue, sort } = parsed.data;
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
    if (serviceSlug) {
      const service = await findServiceBySlug(serviceSlug);
      if (!service) {
        return NextResponse.json(
          { success: false, error: 'Service not found.' },
          { status: 404 },
        );
      }

    }

    const { data: works, total } = await listPublicPortfolio({
      serviceSlug,
      category,
      location,
      featured: featuredValue === undefined ? undefined : featuredValue === 'true',
      sort,
      limit,
      offset: skip,
    });
    const categories = await listServiceCategories();
    const media = await listPortfolioWorkMedia(works.map((work) => work.id));
    const mediaByWork = new Map<string, Array<{
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
      const workImages = mediaByWork.get(image.portfolioWorkId) ?? [];
      workImages.push({
        id: image.id,
        storageKey: image.storageKey,
        deliveryUrl: image.deliveryUrl,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        position: image.position,
        altText: image.altText,
      });
      mediaByWork.set(image.portfolioWorkId, workImages);
    }

    return NextResponse.json({
      success: true,
      categories: categories.map(({ name }) => name),
      data: works.map((work) => ({
        ...work,
        media: mediaByWork.get(work.id) ?? [],
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
