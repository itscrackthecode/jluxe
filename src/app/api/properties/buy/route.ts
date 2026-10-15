import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  buyerAreaUnits,
  buyerBedroomOptions,
  buyerCommercialUseOptions,
  buyerConditionOptions,
  buyerContactMethods,
  buyerLandUseOptions,
  buyerAreaUnitLabel,
  buyerPropertyTypeLabels,
  buyerPurposeOptions,
  buyerReadinessOptions,
  buyerTimelineOptions,
} from '@/lib/buyer-property';
import { createBuyerPropertyEnquiry } from '@/lib/db/queries/buyer-property-enquiries';
import { sendJluxeNotification } from '@/lib/email-notifications';
import { formatEmailDate, renderJluxeEmail } from '@/lib/email-templates';
import { checkPublicApiRateLimit, publicApiRateLimitResponse } from '@/lib/public-api-rate-limit';
import { turnstileResponse, verifyTurnstileToken } from '@/lib/turnstile';
import { readJsonBody } from '@/lib/read-json-body';

const optionalText = (maxLength: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(maxLength).nullable().optional().transform((value) => value ?? null),
);

const amount = z.string().trim()
  .regex(/^\d{1,12}(?:\.\d{1,2})?$/, 'Enter a valid amount.')
  .refine((value) => Number(value) > 0, 'Amount must be greater than zero.');
const nullableAmount = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  amount.nullable().optional().transform((value) => value ?? null),
);

const commonFields = {
  turnstileToken: z.string().min(1).max(2048),
  propertySubtype: z.string().trim().min(2).max(150),
  preferredCity: z.string().trim().min(2).max(255),
  preferredLocality: optionalText(255),
  budgetMin: amount,
  budgetMax: amount,
  purchasePurpose: z.preprocess(
    (value) => value === '' ? null : value,
    z.enum(buyerPurposeOptions).nullable().optional().transform((value) => value ?? null),
  ),
  purchaseTimeline: z.preprocess(
    (value) => value === '' ? null : value,
    z.enum(buyerTimelineOptions).nullable().optional().transform((value) => value ?? null),
  ),
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(32),
  preferredContactMethod: z.enum(buyerContactMethods),
  additionalRequirements: optionalText(5000),
};

const buyerEnquirySchema = z.discriminatedUnion('propertyType', [
  z.object({
    ...commonFields,
    propertyType: z.literal('RESIDENTIAL'),
    details: z.object({
      bedrooms: z.enum(buyerBedroomOptions),
      propertyCondition: z.enum(buyerConditionOptions),
      preferredArea: nullableAmount,
      areaUnit: z.preprocess(
        (value) => value === '' ? null : value,
        z.enum(buyerAreaUnits).nullable().optional().transform((value) => value ?? null),
      ),
    }).strict().superRefine((details, context) => {
      if (details.preferredArea !== null && !details.areaUnit) {
        context.addIssue({ code: 'custom', path: ['areaUnit'], message: 'Choose a unit for the preferred area.' });
      }
    }),
  }),
  z.object({
    ...commonFields,
    propertyType: z.literal('COMMERCIAL'),
    details: z.object({
      intendedUse: z.enum(buyerCommercialUseOptions),
      otherIntendedUse: optionalText(120),
      requiredFloorArea: amount,
      areaUnit: z.enum(buyerAreaUnits),
      readiness: z.enum(buyerReadinessOptions),
    }).strict().superRefine((details, context) => {
      if (details.intendedUse === 'Other' && !details.otherIntendedUse) {
        context.addIssue({ code: 'custom', path: ['otherIntendedUse'], message: 'Please describe the intended use.' });
      }
    }),
  }),
  z.object({
    ...commonFields,
    propertyType: z.literal('LAND_PLOT'),
    details: z.object({
      preferredArea: amount,
      areaUnit: z.enum(buyerAreaUnits),
      intendedUse: z.enum(buyerLandUseOptions),
      otherIntendedUse: optionalText(120),
    }).strict().superRefine((details, context) => {
      if (details.intendedUse === 'Other' && !details.otherIntendedUse) {
        context.addIssue({ code: 'custom', path: ['otherIntendedUse'], message: 'Please describe the intended use.' });
      }
    }),
  }),
  z.object({
    ...commonFields,
    propertyType: z.literal('OTHER'),
    details: z.object({
      additionalDetails: optionalText(1000),
      preferredArea: nullableAmount,
      areaUnit: z.preprocess(
        (value) => value === '' ? null : value,
        z.enum(buyerAreaUnits).nullable().optional().transform((value) => value ?? null),
      ),
    }).strict().superRefine((details, context) => {
      if (details.preferredArea !== null && !details.areaUnit) {
        context.addIssue({ code: 'custom', path: ['areaUnit'], message: 'Choose a unit for the preferred area.' });
      }
    }),
  }),
]).superRefine((input, context) => {
  const validSubtypes = input.propertyType === 'RESIDENTIAL'
    ? ['Apartment', 'Independent house', 'Villa', 'Other']
    : input.propertyType === 'COMMERCIAL'
      ? ['Office', 'Retail space', 'Commercial building', 'Other']
      : input.propertyType === 'LAND_PLOT'
      ? ['Residential plot', 'Commercial plot', 'Agricultural land', 'Other']
      : [];
  if (input.propertyType !== 'OTHER' && !validSubtypes.includes(input.propertySubtype)) {
    context.addIssue({ code: 'custom', path: ['propertySubtype'], message: 'Choose a valid property subtype.' });
  }
  if (Number(input.budgetMax) < Number(input.budgetMin)) {
    context.addIssue({ code: 'custom', path: ['budgetMax'], message: 'Maximum budget must be at least the minimum budget.' });
  }
});

export const runtime = 'nodejs';

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function POST(request: Request) {
  const rateLimit = await checkPublicApiRateLimit(request, {
    endpoint: 'POST /api/properties/buy',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  const rateLimitResponse = publicApiRateLimitResponse(rateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  const bodyResult = await readJsonBody(request, 64 * 1024);
  if (!bodyResult.ok) return NextResponse.json({ success: false, error: bodyResult.error }, { status: bodyResult.status });

  const parsed = buyerEnquirySchema.safeParse(bodyResult.value);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Please review the required details and try again.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const verification = await verifyTurnstileToken(input.turnstileToken, 'buyer_requirements', request.url);
  if (verification !== 'verified') return turnstileResponse(verification);
  const propertyType = input.propertyType;
  const details = Object.fromEntries(
    Object.entries(input.details).filter(([, value]) => typeof value === 'string' && value.length > 0),
  ) as Record<string, string>;

  try {
    const created = await createBuyerPropertyEnquiry({
      propertyType,
      propertySubtype: input.propertySubtype,
      preferredCity: input.preferredCity,
      preferredLocality: input.preferredLocality,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      purchasePurpose: input.purchasePurpose,
      propertyRequirements: details,
      purchaseTimeline: input.purchaseTimeline,
      name: input.name,
      email: input.email,
      phone: input.phone,
      preferredContactMethod: input.preferredContactMethod,
      additionalRequirements: input.additionalRequirements,
    });

    const { enquiry } = created;

    const detailLines = Object.entries(details).map(([key, value]) => `${titleCase(key)}: ${key === 'areaUnit' ? buyerAreaUnitLabel(value) : value}`);
    const plainText = [
      'New JLUXE Buyer Property Enquiry',
      `Reference: ${enquiry.id}`,
      `Submitted: ${new Date(enquiry.createdAt).toISOString()}`,
      '',
      'Enquiry type: General buyer requirements',
      '',
      'Property preferences',
      `Property category: ${buyerPropertyTypeLabels[propertyType]}`,
      `Property type: ${input.propertySubtype}`,
      `Preferred city / location: ${input.preferredCity}`,
      `Preferred locality: ${input.preferredLocality ?? 'Not provided'}`,
      `Budget: INR ${input.budgetMin} to INR ${input.budgetMax}`,
      ...detailLines,
      '',
      'Customer contact',
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone / WhatsApp: ${input.phone}`,
      `Preferred contact method: ${input.preferredContactMethod}`,
      '',
      'Additional requirements:',
      input.additionalRequirements ?? 'Not provided',
    ].join('\n');
    const html = `<h1>New JLUXE General Buyer Requirements Enquiry</h1><p><strong>Reference:</strong> ${escapeHtml(enquiry.id)}<br><strong>Submitted:</strong> ${escapeHtml(new Date(enquiry.createdAt).toISOString())}</p><h2>Property preferences</h2><dl><dt>Property category</dt><dd>${escapeHtml(buyerPropertyTypeLabels[propertyType])}</dd><dt>Property type</dt><dd>${escapeHtml(input.propertySubtype)}</dd><dt>Preferred city / location</dt><dd>${escapeHtml(input.preferredCity)}</dd><dt>Preferred locality</dt><dd>${escapeHtml(input.preferredLocality ?? 'Not provided')}</dd><dt>Budget</dt><dd>INR ${escapeHtml(input.budgetMin)} to INR ${escapeHtml(input.budgetMax)}</dd>${detailLines.map((line) => { const [label, ...value] = line.split(': '); return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value.join(': '))}</dd>`; }).join('')}</dl><h2>Customer contact</h2><dl><dt>Name</dt><dd>${escapeHtml(input.name)}</dd><dt>Email</dt><dd>${escapeHtml(input.email)}</dd><dt>Phone / WhatsApp</dt><dd>${escapeHtml(input.phone)}</dd><dt>Preferred contact method</dt><dd>${escapeHtml(input.preferredContactMethod)}</dd></dl><h2>Additional requirements</h2><p style="white-space:pre-wrap">${escapeHtml(input.additionalRequirements ?? 'Not provided')}</p>`;
    const rendered = renderJluxeEmail({
      title: 'Buyer requirements enquiry',
      summary: 'A customer has shared property requirements for the JLUXE team to review.',
      reference: enquiry.id,
      sections: [
        { title: 'Property preferences', fields: [
          { label: 'Submitted', value: formatEmailDate(enquiry.createdAt) },
          { label: 'Property type', value: buyerPropertyTypeLabels[propertyType] },
          { label: 'Property subtype', value: input.propertySubtype },
          { label: 'Preferred city / location', value: input.preferredCity },
          { label: 'Preferred locality', value: input.preferredLocality },
          { label: 'Minimum budget (INR)', value: input.budgetMin },
          { label: 'Maximum budget (INR)', value: input.budgetMax },
          { label: 'Purchase purpose', value: input.purchasePurpose },
          ...Object.entries(details).map(([key, value]) => ({ label: titleCase(key), value })),
          { label: 'Purchase timeline', value: input.purchaseTimeline },
        ] },
        { title: 'Customer contact', fields: [
          { label: 'Name', value: input.name }, { label: 'Email', value: input.email },
          { label: 'Phone / WhatsApp', value: input.phone },
          { label: 'Preferred contact method', value: input.preferredContactMethod },
        ] },
        { title: 'Additional requirements', fields: [{ label: 'Requirements', value: input.additionalRequirements }] },
      ],
    });

    try {
      await sendJluxeNotification({
        replyTo: input.email,
        subject: `Buyer Requirements Enquiry — ${input.preferredCity}`,
        text: rendered.text,
        html: rendered.html,
      });
    } catch (error) {
      console.error('Failed to send buyer property enquiry notification email.', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
    }

    return NextResponse.json(
      { success: true, message: 'Your property requirements have been submitted successfully.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to process buyer property enquiry.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Unable to submit your property requirements right now. Please try again.' },
      { status: 500 },
    );
  }
}
