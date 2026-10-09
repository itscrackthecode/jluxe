import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { enquiryStatuses } from '@/lib/db/types';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';
import { listEnquiriesForExport } from '@/lib/db/queries/enquiries';

const querySchema = z.object({ search: z.string().trim().max(200).optional(), status: z.enum(enquiryStatuses).optional() });
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  if (!hasAdminPermission(session.role, 'export-enquiries')) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({ search: params.get('search') ?? undefined, status: params.get('status') ?? undefined });
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid export filters.' }, { status: 400 });

  const rows = await listEnquiriesForExport(parsed.data);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Enquiries');
  sheet.columns = [
    { header: 'Date', key: 'createdAt', width: 22 },
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Interested In', key: 'interestedServiceLabel', width: 28 },
    { header: 'Property', key: 'propertyTitle', width: 28 },
    { header: 'Message', key: 'message', width: 60 },
    { header: 'Status', key: 'status', width: 16 },
  ];
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF073B33' } };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.getCell('message').alignment = { wrapText: true, vertical: 'top' };
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="jluxe-enquiries-${date}.xlsx"`,
    },
  });
}
