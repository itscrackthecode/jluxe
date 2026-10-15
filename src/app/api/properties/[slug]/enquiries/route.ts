import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPropertyEnquiry } from '@/lib/db/queries/enquiries';
import { sendJluxeNotification } from '@/lib/email-notifications';
import { formatEmailDate, renderJluxeEmail } from '@/lib/email-templates';
import { siteConfig } from '@/lib/data';
import { checkPublicApiRateLimit, publicApiRateLimitResponse } from '@/lib/public-api-rate-limit';
import { turnstileResponse, verifyTurnstileToken } from '@/lib/turnstile';
import { readJsonBody } from '@/lib/read-json-body';

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(6).max(32),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(5).max(5000),
  configurationId: z.string().uuid().optional(),
  inventoryId: z.string().uuid().optional(),
  turnstileToken: z.string().min(1).max(2048),
}).strict().refine((value) => !(value.configurationId && value.inventoryId), { message: 'Select one configuration or inventory unit.' });

type RouteContext = { params: Promise<{ slug: string }> };
export const runtime = 'nodejs';

function formatPrice(property: { priceAmount: string | null; priceCurrency: string | null; priceMode: string; priceMinimum: string | null; priceMaximum: string | null; priceBasis: string }) {
  if (property.priceMinimum || property.priceMaximum) {
    const money = (value: string | null) => {
      if (!value) return '—';
      const amount = Number(value);
      if (!Number.isFinite(amount)) return 'Not provided';
      try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: property.priceCurrency || 'INR', maximumFractionDigits: 2 }).format(amount); }
      catch { return `${new Intl.NumberFormat().format(amount)} ${property.priceCurrency || 'INR'}`; }
    };
    return `${money(property.priceMinimum)} – ${money(property.priceMaximum)}${property.priceBasis !== 'TOTAL' ? ` / ${property.priceBasis.toLowerCase().replaceAll('_', ' ')}` : ''}`;
  }
  if (!property.priceAmount) return property.priceMode === 'ON_REQUEST' ? 'On request' : null;
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
  const bodyResult = await readJsonBody(request, 16 * 1024);
  if (!bodyResult.ok) return NextResponse.json({ success: false, error: bodyResult.error }, { status: bodyResult.status });
  const parsed = enquirySchema.safeParse(bodyResult.value);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Please review the required details and try again.' }, { status: 400 });
  const verification = await verifyTurnstileToken(parsed.data.turnstileToken, 'property_enquiry', request.url);
  if (verification !== 'verified') return turnstileResponse(verification);

  try {
    const { turnstileToken: _turnstileToken, ...enquiryInput } = parsed.data;
    const created = await createPropertyEnquiry({ slug, ...enquiryInput });
    if (created.kind === 'unavailable') return NextResponse.json({ success: false, error: 'This property is no longer available for enquiry.' }, { status: 409 });
    if (created.kind === 'invalid-configuration') return NextResponse.json({ success: false, error: 'This configuration is not part of the selected property.' }, { status: 400 });

    const { property, enquiry } = created;
    const publicUrl = `${siteConfig.url}/properties/${encodeURIComponent(property.slug)}`;
    const price = formatPrice(property);
    const rendered = renderJluxeEmail({
      title: 'Property enquiry',
      summary: `A customer has enquired about ${property.title}.`,
      reference: enquiry.id,
      sections: [
        { title: 'Property details', fields: [
          { label: 'Submitted', value: formatEmailDate(enquiry.createdAt) },
          { label: 'Property', value: property.title },
          { label: 'Property reference', value: `${property.slug} (${property.id})` },
          { label: 'Location', value: property.location },
          { label: 'Type', value: property.propertyType.replaceAll('_', ' ') },
          { label: 'Listed price', value: price },
          ...(created.configuration ? [{ label: 'Selected configuration', value: created.configuration.name }, { label: 'Configuration price at enquiry', value: created.configuration.priceSnapshot }] : []),
          ...(created.inventory ? [{ label: 'Selected unit / plot', value: created.inventory.reference }, { label: 'Unit price at enquiry', value: created.inventory.priceSnapshot }] : []),
          { label: 'Public listing', value: 'View property listing', linkUrl: publicUrl },
        ] },
        { title: 'Customer contact', fields: [
          { label: 'Name', value: parsed.data.name }, { label: 'Phone / WhatsApp', value: parsed.data.phone },
          { label: 'Email', value: parsed.data.email },
          { label: 'Message', value: parsed.data.message, highlight: true },
        ] },
      ],
      images: property.imageUrl ? [{ url: property.imageUrl, alt: `${property.title} property` }] : [],
    });
    try {
      await sendJluxeNotification({ replyTo: parsed.data.email, subject: `Property Enquiry — ${property.title}`, ...rendered });
    } catch (error) {
      console.error('Failed to send property enquiry notification email.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    }

    return NextResponse.json({ success: true, message: 'Your enquiry has been submitted successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to process property enquiry.', { errorName: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to submit your enquiry right now. Please try again.' }, { status: 500 });
  }
}
