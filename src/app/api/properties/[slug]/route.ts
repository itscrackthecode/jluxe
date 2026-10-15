import { NextResponse } from 'next/server';
import { formatNumericValue } from '@/lib/db/numeric';
import { findPublishedPropertyBySlug, listPropertyMedia } from '@/lib/db/queries/properties';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 180) {
    return NextResponse.json(
      { success: false, error: 'Property not found.' },
      { status: 404 },
    );
  }

  try {
    const property = await findPublishedPropertyBySlug(slug);

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found.' },
        { status: 404 },
      );
    }

    const media = await listPropertyMedia(property.id);

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        priceAmount: formatNumericValue(property.priceAmount),
        plotSize: formatNumericValue(property.plotSize),
        images: media.map(({ id, storageKey, deliveryUrl, mimeType, width, height, position, altText }) => ({
          id,
          storageKey,
          deliveryUrl,
          mimeType,
          width,
          height,
          position,
          altText,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve public property.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { success: false, error: 'Unable to retrieve this property right now.' },
      { status: 500 },
    );
  }
}
