import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPropertyEnquiry } from '@/lib/db/queries/enquiries';
import { sendJluxeNotification } from '@/lib/email-notifications';
import { checkPublicApiRateLimit, publicApiRateLimitResponse } from '@/lib/public-api-rate-limit';

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(5).max(5000),
}).strict();

type RouteContext = { params: Promise<{ slug: string }> };
export const runtime = 'nodejs';

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function formatPrice(property: { priceAmount: string | null; priceCurrency: string | null; priceMode: string }) {
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'On request' : 'Not provided';
  const amount = Number(property.priceAmount);
  if (!Number.isFinite(amount)) return 'Not provided';
  const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: property.priceCurrency || 'INR', maximumFractionDigits: 2 }).format(amount);
  return property.priceMode === 'STARTING_FROM' ? `From ${formatted}` : formatted;
}

export async function POST(request: Request, { params }: RouteContext) {
  const limit = await checkPublicApiRateLimit(request, { endpoint: 'POST /api/properties/[slug]/enquiries', limit: 5, windowMs: 10 * 60 * 1000 });
  const limited = publicApiRateLimitResponse(limit);
  if (limited) return limited;

  const { slug } = await params;
  if (!slug || slug.length > 180) return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 }); }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Please review the required details and try again.' }, { status: 400 });

  try {
    const created = await createPropertyEnquiry({ slug, ...parsed.data });
    if (created.kind === 'unavailable') return NextResponse.json({ success: false, error: 'This property is no longer available for enquiry.' }, { status: 409 });

    const { property, enquiry } = created;
    const publicUrl = `https://thejluxe.com/properties/${encodeURIComponent(property.slug)}`;
    const price = formatPrice(property);
    const text = [
      'New JLUXE Property-Specific Enquiry',
      `Enquiry reference: ${enquiry.id}`,
      `Property: ${property.title}`,
      `Property reference: ${property.slug} (${property.id})`,
      `Location: ${property.location ?? 'Not provided'}`,
      `Type: ${property.propertyType.replaceAll('_', ' ')}`,
      `Listed price: ${price}`,
      `Public listing: ${publicUrl}`,
      '', 'Customer', `Name: ${parsed.data.name}`, `Phone / WhatsApp: ${parsed.data.phone}`, `Email: ${parsed.data.email}`, '', 'Message:', parsed.data.message,
    ].join('\n');
    const html = `<h1>New JLUXE Property-Specific Enquiry</h1><dl><dt>Enquiry reference</dt><dd>${escapeHtml(enquiry.id)}</dd><dt>Property</dt><dd>${escapeHtml(property.title)}</dd><dt>Reference</dt><dd>${escapeHtml(property.slug)} (${escapeHtml(property.id)})</dd><dt>Location</dt><dd>${escapeHtml(property.location ?? 'Not provided')}</dd><dt>Type</dt><dd>${escapeHtml(property.propertyType.replaceAll('_', ' '))}</dd><dt>Listed price</dt><dd>${escapeHtml(price)}</dd><dt>Public listing</dt><dd><a href="${escapeHtml(publicUrl)}">${escapeHtml(publicUrl)}</a></dd></dl><h2>Customer</h2><p>${escapeHtml(parsed.data.name)}<br>${escapeHtml(parsed.data.phone)}<br>${escapeHtml(parsed.data.email)}</p><h2>Message</h2><p style="white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>`;
    try {
      await sendJluxeNotification({ replyTo: parsed.data.email, subject: `Property Enquiry — ${property.title}`, text, html });
    } catch (error) {
      console.error('Failed to send property enquiry notification email.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    }

    return NextResponse.json({ success: true, message: 'Your enquiry has been submitted successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to process property enquiry.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to submit your enquiry right now. Please try again.' }, { status: 500 });
  }
}
