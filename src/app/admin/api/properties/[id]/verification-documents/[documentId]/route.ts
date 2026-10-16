import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { deletePropertyVerificationDocument, findPropertyVerificationDocument } from '@/lib/db/queries/property-verification-documents';

export const runtime = 'nodejs';
const routeParams = z.object({ id: z.string().uuid(), documentId: z.string().uuid() });
type RouteContext = { params: Promise<{ id: string; documentId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsed = routeParams.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });

  try {
    const document = await findPropertyVerificationDocument(parsed.data.documentId, parsed.data.id);
    if (!document) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    const disposition = new URL(request.url).searchParams.get('preview') === '1'
      ? 'inline'
      : 'attachment';
    const asciiName = document.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    const content = new Uint8Array(document.byteSize);
    content.set(document.content);
    return new Response(content.buffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': String(document.byteSize),
        'Content-Disposition': `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to retrieve this verification document.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  if (!await getAdminSession()) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const parsed = routeParams.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });

  try {
    if (!await deletePropertyVerificationDocument(parsed.data.documentId, parsed.data.id)) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to remove this verification document.' }, { status: 500 });
  }
}
