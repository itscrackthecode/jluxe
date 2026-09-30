import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const propertyDetailSelect = {
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
  createdAt: true,
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
} satisfies Prisma.PropertySelect;

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
    const property = await prisma.property.findFirst({
      where: {
        slug,
        publicationStatus: 'PUBLISHED',
      },
      select: propertyDetailSelect,
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found.' },
        { status: 404 },
      );
    }

    const { media, ...propertyData } = property;

    return NextResponse.json({
      success: true,
      data: {
        ...propertyData,
        priceAmount: property.priceAmount?.toString() ?? null,
        plotSize: property.plotSize?.toString() ?? null,
        images: media.map(({ media: image, position, altText }) => ({
          ...image,
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