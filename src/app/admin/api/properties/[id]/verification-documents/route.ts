import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { findPropertyById } from '@/lib/db/queries/properties';
import { createPropertyVerificationDocument, listPropertyVerificationDocuments } from '@/lib/db/queries/property-verification-documents';

export const runtime = 'nodejs';
const routeParams = z.object({ id: z.string().uuid() });
const maxBytes = 4 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsedParams = routeParams.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });

  try {
    if (!await findPropertyById(parsedParams.data.id)) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    const documents = await listPropertyVerificationDocuments(parsedParams.data.id);
    return NextResponse.json({ success: true, data: documents }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to retrieve verification documents.' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsedParams = routeParams.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });

  try {
    if (!await findPropertyById(parsedParams.data.id)) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    const form = await request.formData();
    const value = form.get('file');
    if (!(value instanceof File)) return NextResponse.json({ success: false, error: 'Choose a PDF or DOC file.' }, { status: 400 });
    if (value.size <= 0 || value.size > maxBytes) return NextResponse.json({ success: false, error: 'Each verification document must be no larger than 4 MB.' }, { status: 400 });

    const safeName = value.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) ?? '';
    const extension = safeName.toLowerCase().split('.').pop();
    const bytes = Buffer.from(await value.arrayBuffer());
    const isPdf = extension === 'pdf' && bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'));
    const isDoc = extension === 'doc' && bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    if (!safeName || (!isPdf && !isDoc)) {
      return NextResponse.json({ success: false, error: 'The file content must match a PDF or legacy DOC document.' }, { status: 400 });
    }

    const document = await createPropertyVerificationDocument({
      propertyId: parsedParams.data.id,
      fileName: safeName,
      mimeType: isPdf ? 'application/pdf' : 'application/msword',
      content: bytes,
      adminId: session.adminId,
    });
    return NextResponse.json({ success: true, data: document }, { status: 201, headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to save this verification document.' }, { status: 500 });
  }
}
