import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPropertySlug } from '@/lib/admin-property';
import { createEnquiry } from '@/lib/db/queries/enquiries';
import { createProperty, deleteProperty, type PropertyWrite } from '@/lib/db/queries/properties';
import { hasPostgresErrorCode } from '@/lib/db/errors';
import { plotSizeUnits, propertyTypes, type PlotSizeUnit } from '@/lib/db/types';

const optionalText = (maxLength: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(maxLength).nullable().optional().transform((value) => value ?? null),
);

const sellerPropertySchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(32),
  propertyType: z.enum(propertyTypes),
  location: z.string().trim().min(1).max(255),
  startingPrice: z.string().trim().min(1).max(100),
  plotSize: optionalText(50),
  plotSizeUnit: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.enum(plotSizeUnits).nullable().optional().transform((value) => value ?? null),
  ),
  description: optionalText(10_000),
}).strict();

export const runtime = 'nodejs';

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type SellerInput = z.infer<typeof sellerPropertySchema>;

function parsePlotSize(text: string | null, unit: PlotSizeUnit | null) {
  if (!text) return { plotSize: null, plotSizeUnit: null, unstructuredText: null };
  const match = /^(\d{1,10}(?:\.\d{1,2})?)/.exec(text.replace(/,/g, '').trim());
  const amount = match ? Number(match[1]) : null;
  if (unit && amount !== null && amount > 0) {
    return { plotSize: amount, plotSizeUnit: unit, unstructuredText: null };
  }
  return {
    plotSize: null,
    plotSizeUnit: null,
    unstructuredText: `${text}${unit ? ` (${formatLabel(unit)})` : ''}`,
  };
}

function buildDescription(input: SellerInput, unstructuredPlotText: string | null) {
  const lines = [
    'Seller submission via the Sell Property form.',
    `Starting price: ${input.startingPrice}`,
  ];
  if (unstructuredPlotText) lines.push(`Plot / land area: ${unstructuredPlotText}`);
  if (input.description) {
    lines.push('', 'Additional notes from the seller:', input.description);
  }
  return lines.join('\n');
}

function buildEnquiryMessage(input: SellerInput) {
  return [
    'Seller property submission',
    '',
    `Property type: ${formatLabel(input.propertyType)}`,
    `Location: ${input.location}`,
    `Starting price: ${input.startingPrice}`,
    `Plot / land area: ${input.plotSize ?? 'Not provided'}`,
    `Area unit: ${input.plotSizeUnit ? formatLabel(input.plotSizeUnit) : 'Not provided'}`,
    '',
    'Additional description:',
    input.description ?? 'Not provided',
  ].join('\n');
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = sellerPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Please review the required details and try again.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const title = `${formatLabel(input.propertyType)} in ${input.location}`.slice(0, 200);
  const baseSlug = createPropertySlug(title).slice(0, 176);
  if (!baseSlug) {
    return NextResponse.json(
      { success: false, error: 'Please provide a location we can use to reference your property.' },
      { status: 400 },
    );
  }

  const { plotSize, plotSizeUnit, unstructuredText } = parsePlotSize(input.plotSize, input.plotSizeUnit);
  const description = buildDescription(input, unstructuredText);
  const message = buildEnquiryMessage(input);

  const propertyInput = (slug: string): PropertyWrite => ({
    slug,
    title,
    description,
    location: input.location,
    propertyType: input.propertyType,
    priceAmount: null,
    priceCurrency: null,
    priceMode: 'STARTING_FROM',
    plotSize: plotSize !== null ? String(plotSize) : null,
    plotSizeUnit,
    status: 'AVAILABLE',
    representationType: 'OTHER',
    publicationStatus: 'DRAFT',
  });

  try {
    let property: Awaited<ReturnType<typeof createProperty>> | null = null;
    for (let attempt = 0; attempt < 5 && !property; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      try {
        property = await createProperty(propertyInput(slug));
      } catch (error) {
        if (!hasPostgresErrorCode(error, '23505')) throw error;
      }
    }
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Unable to submit your property details right now. Please try again.' },
        { status: 500 },
      );
    }

    try {
      await createEnquiry({
        name: input.name,
        email: input.email,
        phone: input.phone,
        interestedServiceLabel: 'Real Estate - Seller Property Submission',
        message,
        propertyId: property.id,
      });
    } catch (error) {
      try {
        await deleteProperty(property.id);
      } catch (cleanupError) {
        console.error('Failed to remove seller property after enquiry failure.', {
          errorName: cleanupError instanceof Error ? cleanupError.name : 'UnknownError',
        });
      }
      throw error;
    }

    return NextResponse.json(
      { success: true, message: 'Your property details have been received.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to process seller property submission.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { success: false, error: 'Unable to submit your property details right now. Please try again.' },
      { status: 500 },
    );
  }
}
