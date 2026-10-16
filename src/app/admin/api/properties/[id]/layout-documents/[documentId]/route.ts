import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { deletePropertyLayoutDocument, findPropertyLayoutDocument } from '@/lib/db/queries/property-layout-documents';

export const runtime = 'nodejs';
const paramsSchema = z.object({ id: z.string().uuid(), documentId: z.string().uuid() });
type Context = { params: Promise<{ id: string; documentId: string }> };

async function resolve(params: Promise<{ id: string; documentId: string }>) {
  if (!await getAdminSession()) return { response: NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 }) };
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return { response: NextResponse.json({ success: false, error: 'Layout plan not found.' }, { status: 404 }) };
  const file = await findPropertyLayoutDocument(parsed.data.documentId, parsed.data.id);
  if (!file) return { response: NextResponse.json({ success: false, error: 'Layout plan not found.' }, { status: 404 }) };
  return { parsed: parsed.data, file };
}

export async function GET(request: Request, { params }: Context) {
  try {
    const result = await resolve(params);
    if ('response' in result) return result.response;
    const disposition = new URL(request.url).searchParams.get('preview') === '1' ? 'inline' : 'attachment';
    const name = result.file.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    const content = new Uint8Array(result.file.byteSize); content.set(result.file.content);
    return new Response(content.buffer, { headers: { 'Content-Type': result.file.mimeType, 'Content-Length': String(result.file.byteSize), 'Content-Disposition': `${disposition}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(result.file.fileName)}`, 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
  } catch { return NextResponse.json({ success: false, error: 'Unable to retrieve this layout plan.' }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  try {
    const result = await resolve(params);
    if ('response' in result) return result.response;
    if (!await deletePropertyLayoutDocument(result.parsed.documentId, result.parsed.id)) return NextResponse.json({ success: false, error: 'Layout plan not found.' }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch { return NextResponse.json({ success: false, error: 'Unable to remove this layout plan.' }, { status: 500 }); }
}
