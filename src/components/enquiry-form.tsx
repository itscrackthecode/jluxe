'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const enquirySchema = z.object({
  name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(6, 'Please enter a valid phone or WhatsApp number.'),
  interest: z.string().min(1, 'Please choose an area of interest.'),
  message: z.string().min(12, 'Please add a little more detail so we can help.'),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

const interestOptions = [
  'Real Estate',
  'Business Solutions',
  'Talent & Training',
  'Interiors & Design',
  'Other',
];

export default function EnquiryForm() {
  const [submissionState, setSubmissionState] = useState<'idle' | 'success'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      interest: 'Real Estate',
    },
  });

  useEffect(() => {
    const property = new URLSearchParams(window.location.search).get('property');
    if (!property) return;

    setValue('interest', 'Real Estate');
    setValue('message', `I'm interested in ${property}.`);
  }, [setValue]);

  const onSubmit = async (_values: EnquiryFormValues) => {
    setSubmissionState('idle');
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setSubmissionState('success');
    reset();
  };

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_55px_rgba(6,47,41,0.08)] sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Name *</span>
            <input
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              className={`w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[15px] text-[var(--viridian-950)] outline-none transition focus:border-[var(--gold)] ${errors.name ? 'border-red-500' : 'border-black/10'}`}
              required
              placeholder="Your name"
            />
            {errors.name && <span className="mt-2 block text-sm text-red-600">{errors.name.message}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Email *</span>
            <input
              type="email"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
              className={`w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[15px] text-[var(--viridian-950)] outline-none transition focus:border-[var(--gold)] ${errors.email ? 'border-red-500' : 'border-black/10'}`}
              required
              placeholder="you@example.com"
            />
            {errors.email && <span className="mt-2 block text-sm text-red-600">{errors.email.message}</span>}
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Phone / WhatsApp *</span>
            <input
              {...register('phone')}
              aria-invalid={Boolean(errors.phone)}
              className={`w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[15px] text-[var(--viridian-950)] outline-none transition focus:border-[var(--gold)] ${errors.phone ? 'border-red-500' : 'border-black/10'}`}
              required
              placeholder="+00 00000 00000"
            />
            {errors.phone && <span className="mt-2 block text-sm text-red-600">{errors.phone.message}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">I&apos;m interested in *</span>
            <select
              {...register('interest')}
              aria-invalid={Boolean(errors.interest)}
              className={`w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[15px] text-[var(--viridian-950)] outline-none transition focus:border-[var(--gold)] ${errors.interest ? 'border-red-500' : 'border-black/10'}`}
              required
            >
              {interestOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.interest && <span className="mt-2 block text-sm text-red-600">{errors.interest.message}</span>}
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Message *</span>
          <textarea
            {...register('message')}
            aria-invalid={Boolean(errors.message)}
            rows={6}
            className={`w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[15px] text-[var(--viridian-950)] outline-none transition focus:border-[var(--gold)] ${errors.message ? 'border-red-500' : 'border-black/10'}`}
            required
            placeholder="Tell us a little about what you have in mind..."
          />
          {errors.message && <span className="mt-2 block text-sm text-red-600">{errors.message.message}</span>}
        </label>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--viridian-800)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Enquiry
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {submissionState === 'success' && (
            <div role="status" aria-live="polite" className="flex items-start gap-2 border-l-2 border-[var(--gold)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--viridian-950)]">
              <CheckCircle2 className="h-4 w-4" />
              Your enquiry has been received locally for now. It has not been sent by email.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
