'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/turnstile-widget';
import { careerApplicationConsentText } from '@/lib/career-types';
import { careersHref } from '@/lib/careers-navigation';

const fieldClass = 'mt-2 min-h-12 w-full border border-[#103D33]/20 bg-white px-3.5 text-sm text-[#16392f] placeholder:text-[#75857e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]';

export default function CareerApplicationForm({ jobSlug, jobTitle, basePath }: { jobSlug: string; jobTitle: string; basePath: string }) {
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const idempotencyKey = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const resume = form.get('resume');
      if (!(resume instanceof File) || resume.size === 0) throw new Error('Attach a PDF resume to continue.');
      if (resume.size > 5 * 1024 * 1024 || resume.type !== 'application/pdf' || !resume.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Attach a PDF resume no larger than 5 MB.');
      }
      const token = await turnstileRef.current?.getToken();
      if (!token) throw new Error('Complete the security check and try again.');
      idempotencyKey.current ??= window.crypto.randomUUID();
      form.set('jobSlug', jobSlug);
      form.set('idempotencyKey', idempotencyKey.current);
      form.set('privacyAcknowledged', form.get('privacyAcknowledged') === 'on' ? 'true' : 'false');
      form.set('turnstileToken', token);

      const response = await fetch('/api/careers/applications', { method: 'POST', body: form, cache: 'no-store' });
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Unable to submit your application.');
      window.location.assign(careersHref(basePath, '/application-received'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6" aria-describedby={error ? 'application-error' : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#203d33]">Full name<input name="name" autoComplete="name" required maxLength={150} className={fieldClass} /></label>
        <label className="block text-sm font-medium text-[#203d33]">Email address<input name="email" type="email" autoComplete="email" required maxLength={320} className={fieldClass} /></label>
        <label className="block text-sm font-medium text-[#203d33]">Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={32} className={fieldClass} /></label>
        <label className="block text-sm font-medium text-[#203d33]">Current city<input name="city" autoComplete="address-level2" required maxLength={150} className={fieldClass} /></label>
        <label className="block text-sm font-medium text-[#203d33] sm:col-span-2">Position applied for<input value={jobTitle} readOnly className={`${fieldClass} bg-[#E9EEE9]`} aria-label="Position applied for" /></label>
        <label className="block text-sm font-medium text-[#203d33]">Highest qualification<input name="highestQualification" required maxLength={180} className={fieldClass} /></label>
        <label className="block text-sm font-medium text-[#203d33]">Relevant experience<input name="experience" required maxLength={180} placeholder="For example, 2 years" className={fieldClass} /></label>
        <label className="block text-sm font-medium text-[#203d33] sm:col-span-2">Skills<textarea name="skills" rows={3} maxLength={3000} placeholder="Share skills relevant to this position" className={`${fieldClass} py-3`} /></label>
        <label className="block text-sm font-medium text-[#203d33] sm:col-span-2">Resume (PDF, up to 5 MB)
          <input name="resume" type="file" accept=".pdf,application/pdf" required className={`${fieldClass} cursor-pointer py-2 file:mr-4 file:border-0 file:bg-[#E9EEE9] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#103D33]`} />
        </label>
      </div>

      <div className="space-y-4 border-t border-[#103D33]/15 pt-5">
        <label className="flex items-start gap-3 text-sm leading-6 text-[#425b51]">
          <input name="privacyAcknowledged" type="checkbox" required value="on" className="mt-1 h-4 w-4 accent-[#103D33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]" />
          <span>{careerApplicationConsentText} Read the <a href="https://www.thejluxe.com/privacy-policy" className="font-semibold text-[#103D33] underline decoration-[#C5A46D] underline-offset-4">privacy policy</a>.</span>
        </label>
        <TurnstileWidget ref={turnstileRef} action="career_application" />
      </div>

      {error ? <p id="application-error" role="alert" className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={submitting} className="inline-flex min-h-12 items-center justify-center bg-[#103D33] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0a3028] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">{submitting ? 'Sending application…' : 'Send application'}</button>
        <Link href={careersHref(basePath, `/jobs/${jobSlug}`)} className="text-sm font-semibold text-[#103D33] underline decoration-[#C5A46D] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Back to position</Link>
      </div>
    </form>
  );
}
