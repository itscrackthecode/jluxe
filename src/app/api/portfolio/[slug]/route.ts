import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const portfolioDetailSelect = {
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
    const work = await prisma.portfolioWork.findFirst({
      where: {
        slug,
        publicationStatus: 'PUBLISHED',
      },
      select: portfolioDetailSelect,
    });

    if (!work) {
      return NextResponse.json(
        { success: false, error: 'Portfolio work not found.' },
        { status: 404 },
      );
    }

    const { media, ...workData } = work;

    return NextResponse.json({
      success: true,
      data: {
        ...workData,
        media: media.map(({ media: image, position, altText }) => ({
          ...image,
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