import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { findPropertyById, createPropertyDocument, listPropertyDocuments, removePropertyDocument } from '@/lib/db/queries/properties';
import { createCloudinaryPropertyDocumentSignature, getCloudinaryRawDetails, destroyCloudinaryRaw, isCloudinaryConfigured, verifyCloudinaryUpload } from '@/lib/cloudinary';
import { readJsonBody } from '@/lib/read-json-body';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.string().uuid();
const completeSchema = z.object({
  intent: z.literal('complete'),
  kind: z.enum(['FLOOR_PLAN', 'BROCHURE', 'PRICE_DOCUMENT']),
  title: z.string().trim().min(1).max(255),
  publicId: z.string().regex(/^[a-f0-9]{32}\.pdf$/i),
  version: z.number().int().positive(),
  signature: z.string().regex(/^[a-f0-9]{40}$/i),
  secureUrl: z.string().url(),
  bytes: z.number().int().positive().max(25 * 1024 * 1024),
}).strict();

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  try {
    if (!await findPropertyById(id)) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    const data = await listPropertyDocuments(id);
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to retrieve property documents.' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'edit-content')) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  if (typeof body.value !== 'object' || body.value === null || !('intent' in body.value)) return NextResponse.json({ success: false, error: 'Invalid document upload request.' }, { status: 400 });
  if (body.value.intent === 'sign') {
    if (!await findPropertyById(id)) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    if (!isCloudinaryConfigured()) return NextResponse.json({ success: false, error: 'Cloudinary is not configured.' }, { status: 503 });
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      return NextResponse.json({ success: true, timestamp, ...createCloudinaryPropertyDocumentSignature(timestamp) });
    } catch {
      return NextResponse.json({ success: false, error: 'Cloudinary is not configured.' }, { status: 503 });
    }
  }
  const parsed = completeSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid PDF upload response.' }, { status: 400 });
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const url = new URL(parsed.data.secureUrl);
    if (!cloudName || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || !url.pathname.startsWith(`/${cloudName}/raw/upload/`)
      || !verifyCloudinaryUpload(parsed.data.publicId, parsed.data.version, parsed.data.signature)) {
      return NextResponse.json({ success: false, error: 'Cloudinary document verification failed.' }, { status: 400 });
    }
    const verified = await getCloudinaryRawDetails(parsed.data.publicId);
    if (verified.public_id !== parsed.data.publicId || verified.resource_type !== 'raw' || verified.format !== 'pdf'
      || verified.asset_folder !== 'jluxe/properties/documents' || !Number.isSafeInteger(verified.bytes)
      || verified.bytes <= 0 || verified.bytes > 25 * 1024 * 1024 || verified.bytes !== parsed.data.bytes) {
      await destroyCloudinaryRaw(parsed.data.publicId).catch(() => {});
      return NextResponse.json({ success: false, error: 'Only verified PDF documents up to 25 MB can be saved.' }, { status: 400 });
    }
    const title = parsed.data.title.replace(/[\u0000-\u001f\u007f]/g, '').trim();
    if (!title) return NextResponse.json({ success: false, error: 'Enter a valid document name.' }, { status: 400 });
    const created = await createPropertyDocument({ propertyId: id, storageKey: parsed.data.publicId, title, kind: parsed.data.kind, byteSize: verified.bytes, adminId: session.adminId });
    if (!created) {
      await destroyCloudinaryRaw(parsed.data.publicId).catch(() => {});
      return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to verify property document upload.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to verify and save this document.' }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session || !hasAdminPermission(session.role, 'edit-content')) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  const body = await readJsonBody(request, 4 * 1024);
  if (!body.ok) return NextResponse.json({ success: false, error: body.error }, { status: body.status });
  const parsed = z.object({ mediaId: z.string().uuid() }).strict().safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid document reference.' }, { status: 400 });
  try {
    const removed = await removePropertyDocument(id, parsed.data.mediaId);
    return removed ? NextResponse.json({ success: true }) : NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to remove the document.' }, { status: 500 });
  }
}
