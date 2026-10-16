import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findPublishedPropertyBySlug } from '@/lib/db/queries/properties';
import { findPropertyLayoutDocument } from '@/lib/db/queries/property-layout-documents';

export const runtime = 'nodejs';
const paramsSchema = z.object({ slug: z.string().min(1).max(180), documentId: z.string().uuid() });
type Context = { params: Promise<{ slug: string; documentId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Layout plan not found.' }, { status: 404 });
  try {
    const property = await findPublishedPropertyBySlug(parsed.data.slug);
    if (!property || !['LAND_PLOT', 'PLOT', 'LAND'].includes(property.propertyType)) return NextResponse.json({ success: false, error: 'Layout plan not found.' }, { status: 404 });
    const file = await findPropertyLayoutDocument(parsed.data.documentId, property.id);
    if (!file) return NextResponse.json({ success: false, error: 'Layout plan not found.' }, { status: 404 });
    const safeName = file.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    const content = new Uint8Array(file.byteSize); content.set(file.content);
    return new Response(content.buffer, { headers: { 'Content-Type': file.mimeType, 'Content-Length': String(file.byteSize), 'Content-Disposition': `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`, 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Referrer-Policy': 'no-referrer' } });
  } catch { return NextResponse.json({ success: false, error: 'Unable to retrieve this layout plan.' }, { status: 500 }); }
}
