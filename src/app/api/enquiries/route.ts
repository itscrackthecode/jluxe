import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEnquiry, findServiceById } from '@/lib/db/queries/enquiries';
import { sendJluxeNotification } from '@/lib/email-notifications';

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(32),
  interestedServiceId: z.string().trim().uuid().optional(),
  interestedServiceLabel: z.string().trim().min(1).max(150),
  message: z.string().trim().min(12).max(10_000),
}).strict();

export const runtime = 'nodejs';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendEnquiryNotification(
  input: z.infer<typeof enquirySchema>,
  propertyId: string | null,
  submittedAt: Date,
) {
  const serviceLabel = input.interestedServiceLabel.replace(/[\r\n]+/g, ' ');
  const submittedDate = submittedAt.toISOString();
  const propertyReference = propertyId ? `Property reference: ${propertyId}` : null;
  await sendJluxeNotification({
    replyTo: input.email,
    subject: `New JLUXE Enquiry - ${serviceLabel}`,
    text: [
      'New JLUXE Enquiry',
      '',
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone / WhatsApp: ${input.phone}`,
      `Interested service: ${input.interestedServiceLabel}`,
      ...(propertyReference ? [propertyReference] : []),
      `Submitted: ${submittedDate}`,
      '',
      'Message:',
      input.message,
    ].join('\n'),
    html: [
      '<h1>New JLUXE Enquiry</h1>',
      '<dl>',
      `<dt><strong>Name</strong></dt><dd>${escapeHtml(input.name)}</dd>`,
      `<dt><strong>Email</strong></dt><dd>${escapeHtml(input.email)}</dd>`,
      `<dt><strong>Phone / WhatsApp</strong></dt><dd>${escapeHtml(input.phone)}</dd>`,
      `<dt><strong>Interested service</strong></dt><dd>${escapeHtml(input.interestedServiceLabel)}</dd>`,
      ...(propertyReference
        ? [`<dt><strong>Property reference</strong></dt><dd>${escapeHtml(propertyId!)}</dd>`]
        : []),
      `<dt><strong>Submitted</strong></dt><dd>${escapeHtml(submittedDate)}</dd>`,
      '</dl>',
      '<h2>Message</h2>',
      `<p style="white-space: pre-wrap">${escapeHtml(input.message)}</p>`,
    ].join(''),
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const parsed = enquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed.' },
      { status: 400 },
    );
  }

  const input = parsed.data;

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

    const enquiry = await createEnquiry({
      name: input.name,
      email: input.email,
      phone: input.phone,
      interestedServiceId: input.interestedServiceId,
      interestedServiceLabel: input.interestedServiceLabel,
      message: input.message,
    });

    try {
      await sendEnquiryNotification(input, enquiry.propertyId, enquiry.createdAt);
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
