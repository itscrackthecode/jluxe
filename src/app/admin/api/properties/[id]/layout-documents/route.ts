import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { findPropertyById } from '@/lib/db/queries/properties';
import { createPropertyLayoutDocument, listPropertyLayoutDocuments } from '@/lib/db/queries/property-layout-documents';

export const runtime = 'nodejs';
const paramsSchema = z.object({ id: z.string().uuid() });
const maxBytes = 10 * 1024 * 1024;
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  try {
    if (!await findPropertyById(parsed.data.id)) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: await listPropertyLayoutDocuments(parsed.data.id) }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch { return NextResponse.json({ success: false, error: 'Unable to retrieve layout plans.' }, { status: 500 }); }
}

export async function POST(request: Request, { params }: Context) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  try {
    const property = await findPropertyById(parsed.data.id);
    if (!property) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    if (property.propertyType !== 'LAND_PLOT' && property.propertyType !== 'PLOT' && property.propertyType !== 'LAND') return NextResponse.json({ success: false, error: 'Layout plans are only available for Land / Plot listings.' }, { status: 400 });
    const form = await request.formData();
    const value = form.get('file');
    if (!(value instanceof File)) return NextResponse.json({ success: false, error: 'Choose a PDF or image layout plan.' }, { status: 400 });
    if (value.size <= 0 || value.size > maxBytes) return NextResponse.json({ success: false, error: 'Each layout plan must be no larger than 10 MB.' }, { status: 400 });
    const fileName = value.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) ?? '';
    const extension = fileName.toLowerCase().split('.').pop();
    const bytes = Buffer.from(await value.arrayBuffer());
    const signature = (mime: string) => value.type === mime;
    const isPdf = extension === 'pdf' && signature('application/pdf') && bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'));
    const isJpeg = ['jpg', 'jpeg'].includes(extension ?? '') && signature('image/jpeg') && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = extension === 'png' && signature('image/png') && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = extension === 'webp' && signature('image/webp') && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!fileName || !(isPdf || isJpeg || isPng || isWebp)) return NextResponse.json({ success: false, error: 'File content must match a PDF, JPEG, PNG, or WebP layout plan.' }, { status: 400 });
    const mimeType = isPdf ? 'application/pdf' : isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';
    const document = await createPropertyLayoutDocument({ propertyId: parsed.data.id, fileName, mimeType, content: bytes, adminId: admin.adminId });
    return NextResponse.json({ success: true, data: document }, { status: 201, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch { return NextResponse.json({ success: false, error: 'Unable to save this layout plan.' }, { status: 500 }); }
}
