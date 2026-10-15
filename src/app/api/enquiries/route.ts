import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEnquiry, findServiceById } from '@/lib/db/queries/enquiries';
import { sendJluxeNotification } from '@/lib/email-notifications';
import { formatEmailDate, renderJluxeEmail } from '@/lib/email-templates';
import { checkPublicApiRateLimit, publicApiRateLimitResponse } from '@/lib/public-api-rate-limit';
import { turnstileResponse, verifyTurnstileToken } from '@/lib/turnstile';
import { readJsonBody } from '@/lib/read-json-body';
import { findPublishedPropertyBySlug } from '@/lib/db/queries/properties';

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(32),
  interestedServiceId: z.string().trim().uuid().optional(),
  interestedServiceLabel: z.string().trim().min(1).max(150),
  message: z.string().trim().min(12).max(10_000),
  propertySlug: z.string().trim().min(1).max(180).optional(),
  turnstileToken: z.string().min(1).max(2048),
}).strict();

export const runtime = 'nodejs';

async function sendEnquiryNotification(
  input: z.infer<typeof enquirySchema>,
  propertyId: string | null,
  submittedAt: Date,
  property?: { title: string; slug: string; location: string | null } | null,
) {
  const serviceLabel = input.interestedServiceLabel.replace(/[\r\n]+/g, ' ');
  const submittedDate = formatEmailDate(submittedAt);
  const rendered = renderJluxeEmail({
    title: 'New website enquiry',
    summary: `A customer has contacted JLUXE about ${input.interestedServiceLabel}.`,
    reference: propertyId,
    sections: [
      { title: 'Customer contact', fields: [
        { label: 'Name', value: input.name }, { label: 'Email', value: input.email },
        { label: 'Phone / WhatsApp', value: input.phone },
      ] },
      { title: 'Enquiry details', fields: [
        { label: 'Interested service', value: input.interestedServiceLabel },
        ...(property ? [{ label: 'Property', value: property.title }, { label: 'Property location', value: property.location }, { label: 'Property listing', value: 'View property', linkUrl: `/properties/${encodeURIComponent(property.slug)}` }] : []),
        { label: 'Message', value: input.message },
        { label: 'Submitted', value: submittedDate },
      ] },
    ],
  });
  await sendJluxeNotification({
    replyTo: input.email,
    subject: `New JLUXE Enquiry - ${serviceLabel}`,
    text: rendered.text,
    html: rendered.html,
  });
}

export async function POST(request: Request) {
  const rateLimit = await checkPublicApiRateLimit(request, {
    endpoint: 'POST /api/enquiries',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  const rateLimitResponse = publicApiRateLimitResponse(rateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  const bodyResult = await readJsonBody(request, 32 * 1024);
  if (!bodyResult.ok) return NextResponse.json({ success: false, error: bodyResult.error }, { status: bodyResult.status });

  const parsed = enquirySchema.safeParse(bodyResult.value);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const verification = await verifyTurnstileToken(input.turnstileToken, 'public_enquiry', request.url);
  if (verification !== 'verified') return turnstileResponse(verification);

  try {
    if (input.interestedServiceId) {
      const service = await findServiceById(input.interestedServiceId);

      if (!service) {
        return NextResponse.json(
          { success: false, error: 'The selected service was not found.' },
          { status: 400 },
        );
      }
    }

    const property = input.propertySlug ? await findPublishedPropertyBySlug(input.propertySlug) : null;
    if (input.propertySlug && !property) return NextResponse.json({ success: false, error: 'The selected property is unavailable.' }, { status: 400 });
    const enquiry = await createEnquiry({
      name: input.name,
      email: input.email,
      phone: input.phone,
      interestedServiceId: input.interestedServiceId,
      interestedServiceLabel: input.interestedServiceLabel,
      message: input.message,
      ...(property ? { propertyId: property.id, interestedServiceLabel: 'Real Estate - General Property Enquiry' } : {}),
    });

    try {
      await sendEnquiryNotification(input, enquiry.propertyId, enquiry.createdAt, property);
    } catch (error) {
      console.error('Failed to send enquiry notification email.', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your enquiry has been submitted successfully.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to process public enquiry.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });

    return NextResponse.json(
      { success: false, error: 'Unable to submit your enquiry right now.' },
      { status: 500 },
    );
  }
}
