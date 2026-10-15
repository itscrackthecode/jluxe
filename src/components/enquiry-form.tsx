'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import Link from 'next/link';

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(150),
  email: z.string().trim().email('Please enter a valid email address.').max(320),
  phone: z.string().trim().min(6, 'Please enter a valid phone or WhatsApp number.').max(32),
  interest: z.string().trim().min(1, 'Please choose an area of interest.').max(150),
  message: z.string().trim().min(12, 'Please add a little more detail so we can help.').max(10000),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

const interestOptions = [
  'Real Estate',
  'Business Solutions',
  'Talent & Training',
  'Interior Design & Architecture',
  'Other',
];

export default function EnquiryForm() {
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionError, setSubmissionError] = useState('');
  const submissionLock = useRef(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [selectedProperty, setSelectedProperty] = useState<{ slug: string; title: string; location: string | null } | null>(null);
  const [propertySlug, setPropertySlug] = useState('');

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
    const slug = new URLSearchParams(window.location.search).get('property');
    if (!slug || slug.length > 180) return;
    setPropertySlug(slug);
    const controller = new AbortController();
    fetch(`/api/properties/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (response.ok && result.success) { const property = result.data as { slug: string; title: string; location: string | null }; setSelectedProperty(property); setValue('interest', 'Real Estate'); setValue('message', `I'm interested in ${property.title}.`); } })
      .catch(() => {});
    return () => controller.abort();
  }, [setValue]);

  const onSubmit = async (values: EnquiryFormValues) => {
    if (submissionLock.current) return;

    submissionLock.current = true;
    setSubmissionState('idle');
    setSubmissionError('');

    try {
      const turnstileToken = await turnstileRef.current?.getToken();
      if (!turnstileToken) throw new Error('Security check unavailable.');
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          interestedServiceLabel: values.interest,
          message: values.message,
          ...(selectedProperty && selectedProperty.slug === propertySlug ? { propertySlug: selectedProperty.slug } : {}),
          turnstileToken,
        }),
      });

      const result = await response.json().catch(() => null) as { success?: boolean } | null;
      if (!response.ok || result?.success !== true) {
        setSubmissionState('error');
        setSubmissionError(response.status === 400
          ? 'Please review your details and try again.'
          : 'We couldn’t submit your enquiry right now. Please try again.');
        return;
      }

      setSubmissionState('success');
      reset();
    } catch {
      setSubmissionState('error');
      setSubmissionError('We couldn’t submit your enquiry right now. Please try again.');
    } finally {
      submissionLock.current = false;
    }
  };

  return (
    <div className="rounded-[28px] border border-[var(--viridian-950)]/10 bg-[var(--cream)] p-6 shadow-[0_18px_55px_rgba(6,47,41,0.08)] sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {selectedProperty && <div className="border-l-2 border-[var(--gold)] bg-white/60 px-4 py-3 text-sm"><p className="font-semibold">Enquiry about <Link href={`/properties/${selectedProperty.slug}`} className="underline">{selectedProperty.title}</Link></p>{selectedProperty.location && <p className="mt-1 text-xs text-[var(--muted)]">{selectedProperty.location}</p>}</div>}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Name *</span>
            <input
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              className={`min-h-11 w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px] ${errors.name ? 'border-red-500' : 'border-black/10'}`}
              required
              placeholder="Your name"
            />
            {errors.name && <span className="form-status mt-2 block text-sm text-red-600">{errors.name.message}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Email *</span>
            <input
              type="email"
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
              className={`min-h-11 w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px] ${errors.email ? 'border-red-500' : 'border-black/10'}`}
              required
              placeholder="you@example.com"
            />
            {errors.email && <span className="form-status mt-2 block text-sm text-red-600">{errors.email.message}</span>}
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Phone / WhatsApp *</span>
            <input
              {...register('phone')}
              aria-invalid={Boolean(errors.phone)}
              className={`min-h-11 w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px] ${errors.phone ? 'border-red-500' : 'border-black/10'}`}
              required
              placeholder="+00 00000 00000"
            />
            {errors.phone && <span className="form-status mt-2 block text-sm text-red-600">{errors.phone.message}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">I&apos;m interested in *</span>
            <select
              {...register('interest')}
              aria-invalid={Boolean(errors.interest)}
              className={`min-h-11 w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px] ${errors.interest ? 'border-red-500' : 'border-black/10'}`}
              required
            >
              {interestOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.interest && <span className="form-status mt-2 block text-sm text-red-600">{errors.interest.message}</span>}
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Message *</span>
          <textarea
            {...register('message')}
            aria-invalid={Boolean(errors.message)}
            rows={6}
            className={`w-full rounded-2xl border bg-[var(--cream)] px-4 py-3 text-[16px] text-[var(--viridian-950)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_rgba(197,164,109,0.18)] md:text-[15px] ${errors.message ? 'border-red-500' : 'border-black/10'}`}
            required
            placeholder="Tell us a little about what you have in mind..."
          />
          {errors.message && <span className="form-status mt-2 block text-sm text-red-600">{errors.message.message}</span>}
        </label>

        <TurnstileWidget ref={turnstileRef} action="public_enquiry" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="touch-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--viridian-950)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--viridian-950)] disabled:cursor-not-allowed disabled:opacity-70"
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
            <div role="status" aria-live="polite" className="form-status flex items-start gap-2 border-l-2 border-[var(--gold)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--viridian-950)]">
              <CheckCircle2 className="h-4 w-4" />
              Your enquiry has been submitted successfully.
            </div>
          )}
          {submissionState === 'error' && (
            <p role="alert" className="form-status border-l-2 border-red-600 bg-[var(--cream)] px-3 py-2 text-sm text-red-700">{submissionError}</p>
          )}
        </div>
      </form>
    </div>
  );
}
