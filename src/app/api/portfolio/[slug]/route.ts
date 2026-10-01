import { NextResponse } from 'next/server';
import { findPublishedPortfolioBySlug, listPortfolioWorkMedia } from '@/lib/db/queries/portfolio';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 180) {
    return NextResponse.json(
      { success: false, error: 'Portfolio work not found.' },
      { status: 404 },
    );
  }

  try {
    const work = await findPublishedPortfolioBySlug(slug);

    if (!work) {
      return NextResponse.json(
        { success: false, error: 'Portfolio work not found.' },
        { status: 404 },
      );
    }

    const media = await listPortfolioWorkMedia([work.id]);

    return NextResponse.json({
      success: true,
      data: {
        ...work,
        media: media.map(({ id, storageKey, mimeType, width, height, position, altText }) => ({
          id,
          storageKey,
          mimeType,
          width,
          height,
          position,
          altText,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve public portfolio work.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { success: false, error: 'Unable to retrieve portfolio work right now.' },
      { status: 500 },
    );
  }
}