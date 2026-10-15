import { NextResponse } from 'next/server';
import { formatNumericValue } from '@/lib/db/numeric';
import { findPublishedPropertyBySlug, listPropertyConfigurations, listPropertyDocuments, listPropertyInventory, listPropertyMedia, listPropertyPromotionalMedia } from '@/lib/db/queries/properties';
import { applyConfigurationAvailability, getPropertyAvailability } from '@/lib/property-availability';

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

    const [media, rawConfigurations, documents, inventory, promotionalMedia] = await Promise.all([listPropertyMedia(property.id), listPropertyConfigurations(property.id), listPropertyDocuments(property.id), listPropertyInventory(property.id), listPropertyPromotionalMedia(property.id)]);
    const configurations = applyConfigurationAvailability(rawConfigurations, inventory);

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        availability: getPropertyAvailability(property.availability, configurations, inventory),
        configurations,
        documents,
        inventory,
        promotionalMedia,
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
