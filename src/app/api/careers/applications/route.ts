import { NextResponse } from 'next/server';
import { z } from 'zod';
import { destroyPrivateCareerResume, uploadPrivateCareerResume, validateResumePdf } from '@/lib/careers-resume-storage';
import { careerApplicationConsentVersion } from '@/lib/career-types';
import { createCareerApplication, findCareerApplicationByIdempotencyKey, findPublicCareerJobBySlug } from '@/lib/db/queries/careers';
import { getPostgresErrorContext } from '@/lib/db/errors';
import { hasSameOrigin } from '@/lib/admin-request';
import { checkPublicApiRateLimit, publicApiRateLimitResponse } from '@/lib/public-api-rate-limit';
import { turnstileResponse, verifyTurnstileToken } from '@/lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const maxRequestBytes = 5 * 1024 * 1024 + 32 * 1024;
const applicationSchema = z.object({
  idempotencyKey: z.string().uuid(),
  jobSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(32),
  city: z.string().trim().min(2).max(150),
  highestQualification: z.string().trim().min(2).max(180),
  experience: z.string().trim().min(1).max(180),
  skills: z.string().trim().max(3000).optional().default(''),
  privacyAcknowledged: z.literal('true'),
  turnstileToken: z.string().min(1).max(2048),
});

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ success: false, error: 'Request origin could not be verified.' }, { status: 403 });

  const rateLimit = await checkPublicApiRateLimit(request, {
    endpoint: 'POST /api/careers/applications',
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });
  const rateLimitResponse = publicApiRateLimitResponse(rateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maxRequestBytes) {
    return NextResponse.json({ success: false, error: 'Resume files must be 5 MB or smaller.' }, { status: 413 });
  }
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('multipart/form-data;')) {
    return NextResponse.json({ success: false, error: 'Submit the application as a multipart form.' }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error('Failed to parse the Careers application form.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message.slice(0, 200) : undefined,
    });
    return NextResponse.json({ success: false, error: 'Unable to read the application form.' }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse({
    idempotencyKey: form.get('idempotencyKey'), jobSlug: form.get('jobSlug'), name: form.get('name'),
    email: form.get('email'), phone: form.get('phone'), city: form.get('city'),
    highestQualification: form.get('highestQualification'), experience: form.get('experience'),
    skills: form.get('skills'), privacyAcknowledged: form.get('privacyAcknowledged'),
    turnstileToken: form.get('turnstileToken'),
  });
  const resume = form.get('resume');
  if (!parsed.success || !(resume instanceof File)) {
    return NextResponse.json({ success: false, error: 'Check the required application details and attach a PDF resume.' }, { status: 400 });
  }
  if (resume.type !== 'application/pdf' || !resume.name.toLowerCase().endsWith('.pdf') || resume.size > 5 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: 'Attach a PDF resume no larger than 5 MB.' }, { status: 400 });
  }

  const verification = await verifyTurnstileToken(parsed.data.turnstileToken, 'career_application', request.url);
  if (verification !== 'verified') return turnstileResponse(verification);

  let failureStage = 'application_lookup';
  try {
    failureStage = 'idempotency_lookup';
    const duplicate = await findCareerApplicationByIdempotencyKey(parsed.data.idempotencyKey);
    if (duplicate) return NextResponse.json({ success: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });

    failureStage = 'job_lookup';
    const job = await findPublicCareerJobBySlug(parsed.data.jobSlug);
    if (!job) return NextResponse.json({ success: false, error: 'This position is no longer accepting applications.' }, { status: 404 });

    failureStage = 'read_resume';
    const bytes = Buffer.from(await resume.arrayBuffer());
    if (!validateResumePdf(bytes)) return NextResponse.json({ success: false, error: 'The uploaded file is not a valid PDF.' }, { status: 400 });
    const safeFileName = resume.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) || 'resume.pdf';

    failureStage = 'upload_resume';
    const storedResume = await uploadPrivateCareerResume(bytes);
    try {
      failureStage = 'save_application';
      const result = await createCareerApplication({
        jobSlug: job.slug,
        applicantName: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
        city: parsed.data.city,
        highestQualification: parsed.data.highestQualification,
        experience: parsed.data.experience,
        skills: parsed.data.skills,
        resumeStorageKey: storedResume.storageKey,
        resumeFileName: safeFileName,
        resumeByteSize: storedResume.byteSize,
        consentVersion: careerApplicationConsentVersion,
        idempotencyKey: parsed.data.idempotencyKey,
      });
      if (result === 'closed') {
        await destroyPrivateCareerResume(storedResume.storageKey).catch((cleanupError: unknown) => {
          console.error('Career resume cleanup failed.', { errorName: cleanupError instanceof Error ? cleanupError.name : 'UnknownError' });
        });
        return NextResponse.json({ success: false, error: 'This position is no longer accepting applications.' }, { status: 404 });
      }
      if (result === 'duplicate') {
        await destroyPrivateCareerResume(storedResume.storageKey).catch((cleanupError: unknown) => {
          console.error('Career resume cleanup failed.', { errorName: cleanupError instanceof Error ? cleanupError.name : 'UnknownError' });
        });
      }
      return NextResponse.json({ success: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      await destroyPrivateCareerResume(storedResume.storageKey).catch((cleanupError: unknown) => {
        console.error('Career resume cleanup failed.', { errorName: cleanupError instanceof Error ? cleanupError.name : 'UnknownError' });
      });
      throw error;
    }
  } catch (error) {
    console.error('Failed to process a Careers application.', {
      failureStage,
      ...getPostgresErrorContext(error),
    });
    return NextResponse.json({ success: false, error: 'Unable to submit your application right now. Please try again.' }, { status: 500 });
  }
}
