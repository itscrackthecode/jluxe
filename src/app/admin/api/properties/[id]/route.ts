import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { getAdminSession } from '@/lib/admin-session';
import { adminPropertySchema, createPropertySlug, serializeProperty } from '@/lib/admin-property';
import { prisma } from '@/lib/prisma';

const idSchema = z.string().uuid();
const propertySelect = {
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
  publicationStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PropertySelect;

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });

  try {
    const property = await prisma.property.findUnique({ where: { id }, select: propertySelect });
    if (!property) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: serializeProperty(property) });
  } catch (error) {
    console.error('Failed to retrieve admin property.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve property right now.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });

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
    const property = await prisma.property.update({
      where: { id },
      data: { ...parsed.data, slug, priceAmount: parsed.data.priceAmount, plotSize: parsed.data.plotSize },
      select: propertySelect,
    });
    return NextResponse.json({ success: true, data: serializeProperty(property) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'A property with this slug already exists.' }, { status: 409 });
      if (error.code === 'P2025') return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    }
    console.error('Failed to update admin property.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update property right now.' }, { status: 500 });
  }
}