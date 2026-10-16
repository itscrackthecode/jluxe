import { NextResponse } from 'next/server';
import { formatNumericValue } from '@/lib/db/numeric';
import { findPublishedPropertyBySlug, listPropertyConfigurations, listPropertyMedia } from '@/lib/db/queries/properties';
import { listPropertyLayoutDocuments } from '@/lib/db/queries/property-layout-documents';

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

    const [media, configurations, layouts] = await Promise.all([
      listPropertyMedia(property.id),
      listPropertyConfigurations(property.id),
      property.propertyType === 'LAND_PLOT' || property.propertyType === 'PLOT' || property.propertyType === 'LAND'
        ? listPropertyLayoutDocuments(property.id) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        priceAmount: formatNumericValue(property.priceAmount),
        plotSize: formatNumericValue(property.plotSize),
        configurations: configurations.map((item) => ({
          ...item,
          areaValue: formatNumericValue(item.areaValue),
          dimensionLength: formatNumericValue(item.dimensionLength),
          dimensionWidth: formatNumericValue(item.dimensionWidth),
          carpetArea: formatNumericValue(item.carpetArea ?? null),
          superBuiltUpArea: formatNumericValue(item.superBuiltUpArea ?? null),
        })),
        layoutPlans: layouts.map(({ id, fileName, mimeType, byteSize }) => ({ id, fileName, mimeType, byteSize, url: `/api/properties/${encodeURIComponent(property.slug)}/layouts/${id}` })),
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
