import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminPortfolioSchema } from '@/lib/admin-portfolio';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { hasSameOrigin } from '@/lib/admin-request';
import { hasPostgresErrorCode } from '@/lib/db/errors';
import {
  findAdminPortfolioById,
  findPortfolioServiceById,
  deleteAdminPortfolioWork,
  updateAdminPortfolioWork,
} from '@/lib/db/queries/portfolio';

const idSchema = z.string().uuid();
export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });

  try {
    const work = await findAdminPortfolioById(id);
    if (!work) return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: work });
  } catch (error) {
    console.error('Failed to retrieve admin portfolio work.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to retrieve portfolio work right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = adminPortfolioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid portfolio details.' }, { status: 400 });

  try {
    const service = await findPortfolioServiceById(parsed.data.serviceId);
    if (!service) return NextResponse.json({ success: false, error: 'The selected service was not found.' }, { status: 400 });

    const work = await updateAdminPortfolioWork(id, parsed.data);
    if (!work) return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: work });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return NextResponse.json({ success: false, error: 'Portfolio work with this slug already exists.' }, { status: 409 });
    }
    if (hasPostgresErrorCode(error, '23503')) {
      return NextResponse.json({ success: false, error: 'The selected service was not found.' }, { status: 400 });
    }
    console.error('Failed to update admin portfolio work.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update portfolio work right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'delete-content')) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
  try {
    if (!await deleteAdminPortfolioWork(id)) return NextResponse.json({ success: false, error: 'Portfolio work not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23503')) return NextResponse.json({ success: false, error: 'Portfolio work cannot be deleted while its media associations are in use.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Unable to delete portfolio work right now.' }, { status: 500 });
  }
}
