import { NextResponse } from 'next/server';
import { z } from 'zod';

const enquirySchema = z.object({
  name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(6, 'Please enter a valid phone or WhatsApp number.'),
  interest: z.string().min(1, 'Please choose an area of interest.'),
  message: z.string().min(12, 'Please add a little more detail so we can help.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = enquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? 'Please review the form and try again.',
        },
        { status: 400 },
      );
    }

    const { email, name, phone, interest, message } = parsed.data;

    if (process.env.ENQUIRY_API_MODE === 'live') {
      // Replace this stub with the real PostgreSQL and email integration when the backend is available.
      // Keep all secrets in environment variables, never in client code.
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your enquiry has been accepted and queued for review. The database/email integration can be connected in the next backend phase.',
        data: {
          email,
          name,
          phone,
          interest,
          messageLength: message.length,
        },
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong while processing your enquiry.' },
      { status: 500 },
    );
  }
}
